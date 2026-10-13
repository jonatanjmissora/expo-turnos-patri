import { getDatabase } from "../db/client"
import { getLocalEntity, type LocalEntity } from "../db/local-entities"

export type LocalSyncRecord = Record<string, unknown> & {
	id: string
	userId: string
	updatedAt: string
}

function isBooleanField(entity: LocalEntity, column: string): boolean {
	return entity.booleanFields.includes(column)
}

/**
 * Fila local cruda → payload de la nube (camelCase). Convierte booleanos
 * (`isDepi` 0/1 → true/false) que la API espera.
 */
export function recordToCloud(
	entityKey: string,
	row: LocalSyncRecord
): Record<string, unknown> {
	const entity = getLocalEntity(entityKey)
	if (!entity) return {}

	const out: Record<string, unknown> = {
		id: row.id,
		updatedAt: row.updatedAt,
	}
	for (const column of entity.columns) {
		const value = row[column]
		out[column] = isBooleanField(entity, column)
			? Boolean(value)
			: (value ?? null)
	}
	return out
}

/**
 * Acceso genérico a las tablas locales, para el motor de sync: leer registros,
 * aplicar los que bajan de la nube y borrar por id. Los nombres de tabla/columna
 * salen del registro `LOCAL_ENTITIES` (constantes, no input del usuario).
 */
export const syncLocalRepository = {
	async getAll(entityKey: string, userId: string): Promise<LocalSyncRecord[]> {
		const entity = getLocalEntity(entityKey)
		if (!entity) return []

		const db = await getDatabase()
		return db.getAllAsync<LocalSyncRecord>(
			`SELECT * FROM ${entity.table} WHERE userId = ?`,
			userId
		)
	},

	async getById(
		entityKey: string,
		id: string
	): Promise<LocalSyncRecord | null> {
		const entity = getLocalEntity(entityKey)
		if (!entity) return null

		const db = await getDatabase()
		return db.getFirstAsync<LocalSyncRecord>(
			`SELECT * FROM ${entity.table} WHERE id = ?`,
			id
		)
	},

	/**
	 * Aplica registros de la nube **sin encolar**. Con `replace` limpia el local
	 * del usuario (restore); sin `replace` hace upsert por `id` (merge).
	 * Convierte booleanos de la nube (true/false) → 0/1 postal.
	 */
	async applyCloud(
		entityKey: string,
		userId: string,
		items: Record<string, unknown>[],
		options: { replace: boolean }
	): Promise<void> {
		const entity = getLocalEntity(entityKey)
		if (!entity) return

		const db = await getDatabase()
		const hasCreatedAt = entity.hasCreatedAt === true
		const colNames = ["id", "userId", ...entity.columns, "updatedAt"]
		if (hasCreatedAt) colNames.push("createdAt")
		const placeholders = colNames.map(() => "?").join(", ")

		await db.withTransactionAsync(async () => {
			if (options.replace) {
				await db.runAsync(
					`DELETE FROM ${entity.table} WHERE userId = ?`,
					userId
				)
			}

			for (const item of items) {
				const values: (string | number | null)[] = [item.id as string, userId]
				for (const column of entity.columns) {
					if (isBooleanField(entity, column)) {
						values.push(item[column] ? 1 : 0)
					} else {
						values.push((item[column] ?? null) as string | number | null)
					}
				}
				values.push(item.updatedAt as string)
				if (hasCreatedAt) {
					values.push(
						(item.createdAt as string | undefined) ?? (item.updatedAt as string)
					)
				}

				await db.runAsync(
					`INSERT OR REPLACE INTO ${entity.table} (${colNames.join(", ")}) VALUES (${placeholders})`,
					...values
				)
			}
		})
	},

	async removeByIds(entityKey: string, ids: string[]): Promise<void> {
		if (ids.length === 0) return

		const entity = getLocalEntity(entityKey)
		if (!entity) return

		const db = await getDatabase()
		const placeholders = ids.map(() => "?").join(", ")
		await db.runAsync(
			`DELETE FROM ${entity.table} WHERE id IN (${placeholders})`,
			...ids
		)
	},
}
