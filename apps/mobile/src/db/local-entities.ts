/**
 * Registro de entidades sincronizables del lado local.
 *
 * Las columnas locales se nombran igual que los campos camelCase de la API de la
 * nube (mapeo directo). Debe coincidir con `SYNC_ENTITIES` del backend
 * (`apps/api/lib/sync-entities.ts`).
 */
export type LocalEntity = {
	/** = `entity` en la cola = ruta `/sync/:entity`. */
	key: string
	/** Tabla SQLite. */
	table: string
	/** Columnas de datos (sin `id`, `userId` ni `updatedAt`). */
	columns: string[]
	/** Columnas numéricas. */
	numberFields: string[]
	/** Columnas booleanas (local 0/1 ↔ nube true/false). */
	booleanFields: string[]
	label: string
}

export const LOCAL_ENTITIES: LocalEntity[] = [
	{
		key: "turnos",
		table: "turnos",
		columns: [
			"fecha",
			"hora",
			"duracion",
			"nombre",
			"tratamiento",
			"isDepi",
			"valor",
		],
		numberFields: ["duracion", "valor"],
		booleanFields: ["isDepi"],
		label: "turnos",
	},
]

export function getLocalEntity(key: string): LocalEntity | undefined {
	return LOCAL_ENTITIES.find(entity => entity.key === key)
}
