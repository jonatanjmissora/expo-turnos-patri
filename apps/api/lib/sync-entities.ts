export type SyncColumnType = "text" | "integer" | "real" | "boolean"

export type SyncColumn = {
	/** Nombre del campo en la API (camelCase). */
	camel: string
	/** Nombre de la columna en Postgres (snake_case). */
	snake: string
	type: SyncColumnType
}

export type SyncEntity = {
	/** Tabla en Neon (ya incluye el prefijo `expo_`). */
	table: string
	columns: SyncColumn[]
	/**
	 * Config del cron de purga: además de los tombstones (`deleted_at`), borra las
	 * filas cuya `dateColumn` (TEXT 'YYYY-MM-DD') sea anterior a `olderThanDays`.
	 */
	purge?: { dateColumn: string; olderThanDays: number }
}

/**
 * Registro de entidades sincronizables. Agregar una entidad acá es lo único que
 * hace falta para que `api/sync/[entity].ts` la soporte (crear su tabla en Neon
 * y su contraparte local).
 *
 * Todas las tablas comparten: `id TEXT PRIMARY KEY`, `user_id UUID`,
 * `deleted_at TIMESTAMPTZ` y `updated_at TIMESTAMPTZ`.
 */
export const SYNC_ENTITIES: Record<string, SyncEntity> = {
	turnos: {
		table: "expo_turnos",
		purge: { dateColumn: "fecha", olderThanDays: 365 },
		columns: [
			{ camel: "fecha", snake: "fecha", type: "text" },
			{ camel: "hora", snake: "hora", type: "text" },
			{ camel: "duracion", snake: "duracion", type: "integer" },
			{ camel: "nombre", snake: "nombre", type: "text" },
			{ camel: "tratamiento", snake: "tratamiento", type: "text" },
			{ camel: "isDepi", snake: "is_depi", type: "boolean" },
			{ camel: "valor", snake: "valor", type: "integer" },
		],
	},
}

export function getEntity(name: string): SyncEntity | null {
	return SYNC_ENTITIES[name] ?? null
}

export function coerceValue(
	type: SyncColumnType,
	value: unknown
): string | number | boolean | null {
	if (value === undefined || value === null) return null
	if (type === "text") return typeof value === "string" ? value : null
	if (type === "boolean") return typeof value === "boolean" ? value : null
	return typeof value === "number" && Number.isFinite(value) ? value : null
}
