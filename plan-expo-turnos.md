# Plan: migrar `turnos-alba` a Expo (React Native) — local-first + sync Neon

## Objetivo

Portar la web `react-turnos-alba` (Vite + React + Supabase) a una app **Expo / React Native**,
**local-first**, con **alta de usuario** y **sincronización con Neon**, reutilizando los patrones
ya probados en `expo-enhysa` + `expo-enhysa-backend`.

El dominio no cambia: gestión de **turnos** de un gabinete de estética (calendario mensual,
alta/edición de turnos con detección de solapamiento, listado de clientas con totales).

---

## Decisiones tomadas

| Tema | Decisión |
|------|----------|
| Repositorios | **Monorepo único** (app + backend en un solo repo). |
| Backend / auth | **Auth custom** (register/login + hash + token de sesión) como `expo-enhysa-backend`. Neon solo como Postgres. |
| Ubicación del plan | Este repo (`react-turnos-alba`), archivo `plan-expo-turnos.md`. |
| Datos existentes | **Empezar limpio**: no se migra el historial de Supabase. |
| Fuente de patrones | `expo-enhysa` (app) y `expo-enhysa-backend` (API + Neon). |
| Skills a usar en ejecución | `expo-overview`, `expo-router`, `expo-native-ui`, `react-native-patterns`, `expo-ts-query-patterns`, `expo-sync-local`, `better-auth-patterns` (solo referencia), `expo-eas-apk`. |

---

## 1. Arquitectura objetivo

```
                    App Expo (local-first)
                            │
              UI  ──►  TanStack Query  ──►  Repositories  ──►  SQLite
                            │                        │
                            │                  sync_queue (pendientes)
                            │                        │
                            └────────────►  Sync Manager
                                                     │
                                                     ▼
                                    Backend Vercel  ──►  Neon (Postgres)
                                    (auth + /sync/:entity)
```

- **Toda escritura va primero a SQLite** (la app funciona offline). La nube es espejo/backup.
- El backend deriva el `userId` **del token de sesión**, nunca del body (server-authoritative).
- Idempotencia por `id` (UUID local). **Last-write-wins** por `updatedAt`. Borrado = **tombstone** (`deleted_at`).

---

## 2. Estructura del monorepo

Repo nuevo `expo-turnos-alba/` (pnpm workspace):

```
expo-turnos-alba/
├── pnpm-workspace.yaml
├── plan-expo-turnos.md
├── apps/
│   ├── mobile/                     # App Expo (expo-router)
│   │   ├── app/
│   │   │   ├── _layout.tsx         # Providers: QueryClient, Session, SyncBootstrap, ToastHost
│   │   │   ├── auth/
│   │   │   │   ├── _layout.tsx
│   │   │   │   ├── login.tsx
│   │   │   │   └── register.tsx
│   │   │   ├── (tabs)/
│   │   │   │   ├── _layout.tsx
│   │   │   │   ├── index.tsx       # Calendario
│   │   │   │   └── clientas.tsx
│   │   │   └── turno/
│   │   │       ├── nuevo.tsx
│   │   │       └── [id].tsx
│   │   ├── components/
│   │   ├── constants/              # theme.ts, tratamientos.ts
│   │   ├── src/
│   │   │   ├── api/client.ts
│   │   │   ├── auth/               # auth.service.ts, password.ts, data-guard.ts
│   │   │   ├── session/            # session.service.ts, session-context.tsx
│   │   │   ├── db/                 # client.ts, local-entities.ts, schema/
│   │   │   ├── repositories/       # turno.repository.ts, sync-queue.repository.ts, sync-local.repository.ts, user.repository.ts
│   │   │   ├── query/              # query-client.ts, keys/, hooks/
│   │   │   ├── sync/               # sync-manager.ts, restore.ts, SyncBootstrap.tsx, ...
│   │   │   ├── services/           # port de la lógica de dominio (conflictos, formato, calendario)
│   │   │   └── ui/                 # toast.ts, ToastHost.tsx, SyncProgressBar.tsx
│   │   ├── assets/
│   │   ├── app.json / eas.json
│   │   └── package.json
│   └── api/                        # Backend (Vercel Serverless)
│       ├── api/
│       │   ├── health.ts
│       │   ├── auth/[...action].ts
│       │   └── sync/[entity].ts
│       ├── lib/                    # auth.ts, db.ts, password.ts, tokens.ts, sync-entities.ts, handlers/
│       ├── schema.sql              # expo_users, expo_sessions, expo_turnos
│       ├── vercel.json
│       └── package.json
└── packages/
    └── shared/                     # (opcional) tipos/constantes compartidos
```

> Alternativa más simple si se quiere evitar el workspace pnpm: `app/` + `api/` en la raíz del
> repo con dos `package.json` y `vercel.json` apuntando a `api/`. El workspace es más limpio para
> adelante.

---

## 3. Modelo de datos

### 3.1 Cambio clave respecto de la web

En la web el `id` **numérico** codifica fecha+hora (`202306051000`). Eso no sirve para sync (no es
estable ni único entre dispositivos). En Expo:

- `id` = **`randomUUID()`** (mismo UUID local/cosmos en la nube).
- `fecha` y `hora` pasan a ser columnas propias (`fecha` `YYYY-MM-DD`, `hora` `HHMM`).
- `user_email` **desaparece** (el `userId` lo inyecta la capa de sesión y lo valida el server).
- Editar fecha/hora ya **no cambia el id** → se simplifica el viejo caso `id === newId`.

### 3.2 Tabla local SQLite `turnos`

```sql
CREATE TABLE IF NOT EXISTS turnos (
    id          TEXT PRIMARY KEY NOT NULL,   -- randomUUID()
    userId      TEXT NOT NULL,
    fecha       TEXT NOT NULL,               -- 'YYYY-MM-DD'
    hora        TEXT NOT NULL,               -- 'HHMM'
    duracion    INTEGER NOT NULL,            -- minutos
    nombre      TEXT NOT NULL,
    tratamiento TEXT NOT NULL,
    isDepi      INTEGER NOT NULL DEFAULT 0,  -- 0 | 1
    valor       INTEGER NOT NULL,            -- ARS, entero
    createdAt   TEXT NOT NULL,
    updatedAt   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_turnos_user_fecha ON turnos (userId, fecha);
```

### 3.3 Tabla nube Neon `expo_turnos`

```sql
CREATE TABLE IF NOT EXISTS expo_turnos (
    id           TEXT PRIMARY KEY,
    user_id      UUID NOT NULL,
    fecha        TEXT,
    hora         TEXT,
    duracion     INTEGER,
    nombre       TEXT,
    tratamiento  TEXT,
    is_depi      BOOLEAN,
    valor        INTEGER,
    deleted_at   TIMESTAMPTZ,
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_expo_turnos_user ON expo_turnos (user_id);
```

### 3.4 Identidad (Neon)

`expo_users` (`id UUID`, `email UNIQUE`, `password_hash`, `name`, `user_image`, timestamps) y
`expo_sessions` (`token PK`, `user_id`, `expires_at`). Se crean en `lib/db.ts` (`ensureSchema`).

### 3.5 Catálogos y derivados (no se sincronizan)

- `TRATAMIENTO_OPTIONS` / `DEPILACION_OPTIONS` → `constants/tratamientos.ts` (constantes locales).
- **Clientas**: vista derivada de `turnos` (agrupa por `nombre`, total por clienta). No es tabla.
- **Calendario**: se genera dinámicamente (ver §servicios) — se descarta el `MESES` precomputado
  2022–2025 de `src/data/calendario.js`.

---

## 4. Mapeo origen → destino

| Origen (web) | Destino (Expo) |
|--------------|----------------|
| `src/backend/supabase.js` | `apps/mobile/src/api/client.ts` + `apps/api/*` |
| `src/hooks/useTurnos.jsx` | `src/query/hooks/use-turnos.ts` + `src/repositories/turno.repository.ts` |
| `src/hooks/useAuth.jsx` | `src/auth/auth.service.ts` + `src/session/session.service.ts` |
| `src/context/AuthContext.jsx` | `src/session/session-context.tsx` |
| `src/context/TurnosContext.jsx` | `src/query/` (TanStack Query) |
| `src/context/Protected.jsx` | guard en `app/(tabs)/_layout.tsx` (redirección a login) |
| `src/pages/Login.jsx` | `app/auth/login.tsx` (+ `register.tsx` nuevo) |
| `src/pages/Calendar.jsx` | `app/(tabs)/index.tsx` |
| `src/pages/Clientas.jsx` | `app/(tabs)/clientas.tsx` |
| `src/pages/Form.jsx` | `app/turno/nuevo.tsx` + `app/turno/[id].tsx` |
| `src/components/Header.jsx` | `components/Header.tsx` + tabs (expo-router) |
| `src/components/Calendar/*` | `components/calendar/*` |
| `src/components/Form/*` | `components/form/*` (RN: TextInput, Pressable, DateTimePicker) |
| `src/services/formUtils.js` | `src/services/form.ts` (refactor: ver §servicios) |
| `src/services/formatTurnos.js` | `src/services/format-turnos.ts` |
| `src/services/getClientas.js` | `src/services/get-clientas.ts` (selector derivado) |
| `src/services/getHeaderDay.js` | `src/services/header-day.ts` (usa `Intl`/`date-fns`) |
| `src/services/getActualDate.js` | helper local (`getActualDate`) |
| `src/services/formatedValor.js` | `formatValor` (`es-AR`) |
| `src/data/tratamientos.js` | `constants/tratamientos.ts` |
| `src/data/calendario.js` (MESES) | **descartar** → `src/services/calendar.ts` (weeks dinámicas) |
| `src/data/turnos.js` | **descartar** (datos de ejemplo) |
| CSS (`src/styles/*`, `App.css`) | `constants/theme.ts` + estilos RN |

---

## 5. Etapa 0 — Scaffold del monorepo

1. `npx create-expo-app@latest` (TypeScript, expo-router) → mover a `apps/mobile`.
2. Inicializar workspace: `pnpm-workspace.yaml` (`apps/*`, `packages/*`).
3. Biome (`biome check`) en mobile y api, como en `expo-enhysa`.
4. Base del backend en `apps/api`: `package.json` (`@neondatabase/serverless`, `@vercel/node`),
   `vercel.json`, `apps/api/.env` (`DATABASE_URL`, `API_TOKEN`, `CRON_SECRET`).
5. `app.json` (name `Turnos Patri`, slug, iconos/splash desde `src/assets/logo.svg`),
   `eas.json` con perfil `preview` (`distribution: internal`, `buildType: apk`).
6. `apps/mobile/.env` con `EXPO_PUBLIC_API_URL` y `EXPO_PUBLIC_API_TOKEN`.

**Verificación:** `pnpm --filter mobile start` levanta la app y `apps/api` responde `/health`.

---

## 6. Etapa 1 — Usuario: alta, login y sesión (hito 0)

> Reutiliza el patrón de `plan-user.md` de `expo-enhysa`. **Sin** identidad demo `user-1`
> (a diferencia de EnHySa): en Turnos Patri el acceso requiere cuenta, como en la web.
> Se conserva el **login offline** (verificar contra el hash local) para que la app siga
> funcionando sin conexión después del primer ingreso.

### Backend (`apps/api`)

- `lib/db.ts` → `ensureSchema()` (crea `expo_users`, `expo_sessions`).
- `lib/password.ts` → `hashPassword` / `verifyPassword` (hash + salt).
- `lib/auth.ts` → `isAuthorized` (Bearer global), `createSession`, `getSessionUser`, `deleteSession`.
- `lib/handlers/` → `register.ts`, `login.ts`, `me.ts`, `logout.ts`.
- `api/auth/[...action].ts` → router de `/register`, `/login`, `/me`, `/logout`.

### App (`apps/mobile`)

- `src/session/session.service.ts` → `getSession`, `getUserId`, `setActiveUser`, `clear`
  (persistencia en `expo-secure-store`).
- `src/session/session-context.tsx` → provider de identidad activa + `useUserId()`.
- `src/auth/password.ts` → `hashPassword` / `verifyPassword` (espejo local; `expo-crypto`).
- `src/auth/auth.service.ts` → `register()`, `login()` (cloud + fallback hash local), `signOut()`.
- `src/repositories/user.repository.ts` → `upsertFromCloud`, `getByEmail`, `getById`.
- `src/api/client.ts` → `apiRegister`, `apiLogin`, `apiMe`, `apiLogout` + inyección de
  `x-session-token` y manejo de 401.
- Pantallas `app/auth/login.tsx` y `app/auth/register.tsx` con `@tanstack/react-form` + `zod`.
- Guard: `app/(tabs)/_layout.tsx` redirige a `/auth/login` si no hay sesión.

**Tabla local `users`** (espejo del usuario de la nube; guarda `passwordHash` para login offline):

```sql
CREATE TABLE IF NOT EXISTS users (
    id           TEXT PRIMARY KEY NOT NULL,
    email        TEXT NOT NULL UNIQUE,
    passwordHash TEXT,
    name         TEXT,
    createdAt    TEXT NOT NULL,
    updatedAt    TEXT NOT NULL
);
```

**Verificación:** alta de usuario nueva → fila en `expo_users` + token; login online y login
offline (con la red cortada) funcionan; cerrar y reabrir mantiene la sesión.

---

## 7. Etapa 2 — Local-first (hito 1)

### 7.1 Base de datos y repositorios

- `src/db/client.ts` → `getDatabase()` (patrón `expo-sqlite` de `expo-enhysa`: `user_version`
  para resets/reset único, `ensureUpdatedAtColumn`).
- `src/db/schema/turnos.ts` → `CREATE_TURNOS_TABLE` (§3.2).
- `src/db/schema/sync-queue.ts` → `CREATE_SYNC_QUEUE_TABLE` (cola de pendientes).
- `src/repositories/turno.repository.ts` → CRUD local (`create`, `update`, `delete`, `getAll`,
  `getByFecha`). Firma con `userId` en el input, inyectado por Query.
- `src/db/local-entities.ts` → registro genérico para el motor de sync:

```ts
export const LOCAL_ENTITIES: LocalEntity[] = [
  {
    key: "turnos",
    table: "turnos",
    columns: ["fecha", "hora", "duracion", "nombre", "tratamiento", "isDepi", "valor"],
    numberFields: ["duracion", "isDepi", "valor"],
    imageFields: [],
    imageArrayFields: [],
    label: "turnos",
  },
]
```

### 7.2 Capa Query (TanStack Query)

- `src/query/query-client.ts` + provider en `_layout.tsx`.
- `src/query/keys/turnos.keys.ts` (keys con `userId`).
- `src/query/hooks/use-turnos.ts` → `useQuery` de todos los turnos del usuario.
- `src/query/hooks/use-turno-mutations.ts` → `create/update/delete` con invalidation.
- `useUserId()` desde la sesión (la UI **nunca** pasa `userId`).

### 7.3 Servicios (port de la lógica de dominio)

- `src/services/form.ts`:
  - `checkHoraFormat` (igual que hoy).
  - `checkTurnoInConflict(fecha, hora, duracion, turnos, excludeId)` → **pure** (misma lógica de
    solapamiento de `useForm.jsx`, sin DOM).
  - `getTratamiento(...)`: **refactor obligatorio** — la web lee `document.querySelectorAll(".active")`
    (antipatrón que no existe en RN). El multi-select de depilación pasa a ser **estado de React**
    (`string[]`) y la función recibe ese array.
- `src/services/format-turnos.ts` → agrupa `turnos[]` en `{ [fecha]: Turno[] }`.
- `src/services/get-clientas.ts` → agrupa por `nombre`, ordena, calcula totales.
- `src/services/header-day.ts` → día/mes en español (usar `date-fns` + locale `es`).
- `src/services/calendar.ts` → genera las semanas (Lun–Sáb) del mes **dinámicamente**:
  reemplaza el objeto `MESES`. Firma sugerida: `getMonthWeeks(year, month): string[][]`.
- `formatValor` → `Intl.NumberFormat("es-AR")`.

### 7.4 UI nativa

- **Tema**: `constants/theme.ts` (colores, espaciado, radios, tipografía) — port de los CSS.
- **Tabs** (`app/(tabs)/_layout.tsx`): `Turnos` (calendario) y `Clientas`.
- **Calendario** (`app/(tabs)/index.tsx`): `CalendarBoard` + `CalendarWeek` + `DateCell` +
  `DateCellList`/`TurnoRow`. Totales por día y por semana (igual que hoy). Navegación de meses
  con flechas; el día de hoy resaltado.
- **Formulario de turno** (`app/turno/nuevo.tsx` y `app/turno/[id].tsx`):
  - `InputHora` (numérico 4 dígitos), `Input` nombre, `InputDuracion` (stepper ±15, `Pressable`),
    `Input` valor, `Select` tratamiento.
  - `DateTimePicker` (`@react-native-community/datetimepicker`) para el día al editar.
  - Multi-select de **depilación** con chips (`Pressable`, estado booleano por opción).
  - Al guardar: validar hora → detectar conflicto → `create`/`update`/`delete+create`.
- **Clientas** (`app/(tabs)/clientas.tsx`): acordeón por clienta (expandible) con totales.

**Verificación:** crear/editar/borrar turnos 100% offline; calendario y totales correctos;
conflictos de horario detectados; listado de clientas con totales.

---

## 8. Etapa 3 — Sincronización con Neon (hito 2)

> Reutiliza el patrón de `plan-sync-tecnico.md` y el skill `expo-sync-local`. Una sola entidad
> (`turnos`). **Sin imágenes** → no hace falta UploadThing.

### 8.1 Backend

- `apps/api/schema.sql` → `expo_turnos` (§3.3).
- `lib/sync-entities.ts`:

```ts
export const SYNC_ENTITIES = {
  turnos: {
    table: "expo_turnos",
    columns: [
      { camel: "fecha",       snake: "fecha",       type: "text" },
      { camel: "hora",        snake: "hora",        type: "text" },
      { camel: "duracion",    snake: "duracion",    type: "integer" },
      { camel: "nombre",      snake: "nombre",      type: "text" },
      { camel: "tratamiento", snake: "tratamiento", type: "text" },
      { camel: "isDepi",      snake: "is_depi",     type: "boolean" },
      { camel: "valor",       snake: "valor",       type: "integer" },
    ],
  },
}
```

- `api/sync/[entity].ts` → **una sola Function** (GET/POST/DELETE + cron de purga de tombstones),
  derivando `userId` de la sesión (patrón `expo-enhysa-backend`).

### 8.2 App

- `src/repositories/sync-queue.repository.ts` (`enqueue`/`getAll`/`count`/`remove`),
  `src/repositories/sync-local.repository.ts` (acceso genérico + `applyCloud`).
- `src/sync/sync-manager.ts` → `flushEntity` / `flushAll` (lock por `userId:entity`, anti-loop,
  `isOffline()`).
- `src/sync/restore.ts` + `restore-flag.ts` → detección global y popup único
  (`Trabajar con la nube` | `Empezar de cero` | `Combinar`), con confirmación destructiva.
- `src/sync/SyncBootstrap.tsx` montado en `_layout.tsx`: restore (una vez por instalación) +
  `flushAll` al arrancar y al recuperar conexión.
- `src/sync/use-after-entity-change.ts` → dispara flush tras cada mutación de `turno.repository`.
- `src/utils/network.ts` → `isOffline()` / `useIsOffline()` (`expo-network`).
- UI: `src/ui/toast.ts` + `ToastHost.tsx` (toast offline), `src/ui/SyncProgressBar.tsx`,
  badge de pendientes en el header (`useSyncStatus`).
- En `turno.repository.create/update/delete`: encolar (`enqueue(userId, "turnos", id, op)`).

**Verificación:**
1. Crear turnos offline → quedan pendientes (badge > 0).
2. Recuperar conexión → flush automático + barra de progreso + badge en 0.
3. Reinstalar / otro dispositivo → login → restore elige política y baja los turnos de Neon.

---

## 9. Etapa 4 — Pulido, build y distribución

- Tema/estética final, estados de carga/vacío/error, accesibilidad, teclado en formularios.
- Build Android (APK) con EAS → skill `expo-eas-apk`; iOS opcional.
- Deploy del backend en Vercel (`apps/api`), variables de entorno en Vercel.
- `EXPO_PUBLIC_API_URL` apuntando al dominio de producción.
- (Opcional) OTA updates con `eas-update`.
- (Opcional) Web con `react-native-web` si se quiere conservar el acceso desde navegador.

---

## 10. Convenciones y entorno

- **Package manager**: pnpm. **Lint/format**: Biome. **Tipado**: TS estricto + `zod` en forms/API.
- Variables:
  - `apps/mobile/.env` → `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_API_TOKEN` (solo `EXPO_PUBLIC_*`).
  - `apps/api/.env` → `DATABASE_URL` (Neon), `API_TOKEN`, `CRON_SECRET`.
- **Nunca** poner secretos del backend en la app.
- SQL local: columnas `camelCase`; nube: `snake_case` (mapeo en `SYNC_ENTITIES`).
- Instalar paquetes Expo con `npx expo install` para respetar la versión del SDK.

---

## 11. Riesgos y decisiones abiertas

1. **Sin identidad demo**: se elimina `user-1`. Consecuencia: no se usa si no hay cuenta. Si se
   prefiere permitir uso sin registro, se adopta el patrón `user-1` de EnHySa (migración
   obligatoria al primer registro) — decidir antes de la Etapa 1.
2. **Login offline**: requiere que el `passwordHash` local se haya guardado en el primer login
   online. Si se quiere login offline en la primera instalación, es imposible (no hay hash).
3. **Conflictos de horario solo en cliente**: la nube no valida solapamientos; dos dispositivos
   podrían crear turnos superpuestos y el merge los conserva. Aceptable para 1 profesional.
4. **`updatedAt` en LWW**: usar el `updatedAt` del dispositivo al escribir (como hoy en EnHySa).
   Si se quiere precisión, comparar contra el `updated_at` del server.
5. **`MESES` precomputado**: se reemplaza por generación dinámica; verificar años bisiestos y el
   corte Lun–Sáb (la web empieza la semana en lunes y muestra 6 columnas).
6. **Migración de datos**: descartada (empezar limpio). Si cambia la decisión, exportar de
   Supabase → transformar `id` numérico → UUID + `fecha`/`hora` → insertar en `expo_turnos`.

---

## 12. Checklist resumida de ejecución

**Etapa 0 — Scaffold**
- [ ] `create-expo-app` + workspace pnpm + Biome.
- [ ] `apps/api` (Vercel + Neon) con `/health`.
- [ ] `app.json`, `eas.json`, `.env` (mobile y api).

**Etapa 1 — Usuario (hito 0)**
- [ ] `expo_users` / `expo_sessions` + password/auth/handlers/routers.
- [ ] `session.service` + `session-context` + `useUserId`.
- [ ] `auth.service` (register/login/signOut) + login offline por hash.
- [ ] `user.repository` (espejo local) + tabla `users`.
- [ ] Pantallas login/register + guard.

**Etapa 2 — Local-first (hito 1)**
- [ ] `db/client` + schema `turnos` + `sync_queue`.
- [ ] `turno.repository` (CRUD local).
- [ ] Query keys + hooks + mutations.
- [ ] Servicios (`form`, `format-turnos`, `get-clientas`, `header-day`, `calendar`, `formatValor`).
- [ ] Tema + Tabs + Calendario + Form + Clientas.

**Etapa 3 — Sync (hito 2)**
- [ ] `expo_turnos` + `SYNC_ENTITIES` + `api/sync/[entity].ts`.
- [ ] `sync-queue` / `sync-local` / `sync-manager` / `restore` / `SyncBootstrap`.
- [ ] `enqueue` en repo + `use-after-entity-change`.
- [ ] Toast offline + barra de progreso + badge de pendientes.
- [ ] Verificación offline → online → restore en instalación limpia.

**Etapa 4 — Distribución**
- [ ] APK con EAS + deploy Vercel + URL de producción.
- [ ] (Opcional) OTA + web.
