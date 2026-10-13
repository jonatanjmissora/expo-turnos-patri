-- Turnos Alba backend — schema Neon
-- Las tablas de identidad y `expo_turnos` también se crean de forma idempotente
-- en `lib/db.ts` (`ensureSchema`). Este archivo queda como referencia / para
-- ejecutar manualmente en Neon.

-- 1. Usuarios (ancla de identidad: email -> userId canónico)
CREATE TABLE IF NOT EXISTS expo_users (
	id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	email         TEXT NOT NULL UNIQUE,
	password_hash TEXT NOT NULL,
	name          TEXT,
	user_image    TEXT,
	created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
	updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Sesiones (token opaco revocable, ~30 días)
CREATE TABLE IF NOT EXISTS expo_sessions (
	token      TEXT PRIMARY KEY,
	user_id    UUID NOT NULL REFERENCES expo_users(id) ON DELETE CASCADE,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	expires_at TIMESTAMPTZ NOT NULL
);

-- 3. Turnos (backup/sync local-first). `id` = UUID local → idempotencia.
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

CREATE INDEX IF NOT EXISTS idx_expo_turnos_user
	ON expo_turnos (user_id);
