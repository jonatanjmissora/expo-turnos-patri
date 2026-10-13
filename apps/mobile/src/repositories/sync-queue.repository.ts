import { randomUUID } from "expo-crypto"
import { getDatabase } from "../db/client"
import { CREATE_SYNC_QUEUE_TABLE } from "../db/schema/sync-queue"

export type SyncOperation = "upsert" | "delete"

export type SyncQueueEntry = {
	id: string
	userId: string
	entity: string
	recordId: string
	operation: SyncOperation
	createdAt: string
}

async function init() {
	const db = await getDatabase()
	await db.execAsync(CREATE_SYNC_QUEUE_TABLE)
}

/**
 * Cola de operaciones pendientes de sincronizar con la nube.
 * Un solo registro por `(userId, entity, recordId)`: editar el mismo registro
 * varias veces offline queda coalescido en una sola operación.
 */
export const syncQueueRepository = {
	async enqueue(
		userId: string,
		entity: string,
		recordId: string,
		operation: SyncOperation
	): Promise<void> {
		await init()
		const db = await getDatabase()

		await db.runAsync(
			`
				INSERT INTO sync_queue (id, userId, entity, recordId, operation, createdAt)
				VALUES (?, ?, ?, ?, ?, ?)
				ON CONFLICT(userId, entity, recordId) DO UPDATE SET
					operation = excluded.operation,
					createdAt = excluded.createdAt
			`,
			randomUUID(),
			userId,
			entity,
			recordId,
			operation,
			new Date().toISOString()
		)
	},

	async getAllByUserId(userId: string): Promise<SyncQueueEntry[]> {
		await init()
		const db = await getDatabase()
		return db.getAllAsync<SyncQueueEntry>(
			`
				SELECT id, userId, entity, recordId, operation, createdAt
				FROM sync_queue
				WHERE userId = ?
				ORDER BY createdAt ASC
			`,
			userId
		)
	},

	async getCountByUserId(userId: string): Promise<number> {
		await init()
		const db = await getDatabase()
		const row = await db.getFirstAsync<{ cnt: number }>(
			`SELECT COUNT(*) AS cnt FROM sync_queue WHERE userId = ?`,
			userId
		)
		return row?.cnt ?? 0
	},

	async getCountsByEntity(userId: string): Promise<Record<string, number>> {
		await init()
		const db = await getDatabase()
		const rows = await db.getAllAsync<{ entity: string; cnt: number }>(
			`SELECT entity, COUNT(*) AS cnt FROM sync_queue WHERE userId = ? GROUP BY entity`,
			userId
		)
		const counts: Record<string, number> = {}
		for (const row of rows) counts[row.entity] = row.cnt
		return counts
	},

	async remove(id: string): Promise<void> {
		await init()
		const db = await getDatabase()
		await db.runAsync(`DELETE FROM sync_queue WHERE id = ?`, id)
	},

	async removeMany(ids: string[]): Promise<void> {
		if (ids.length === 0) return
		await init()
		const db = await getDatabase()
		const placeholders = ids.map(() => "?").join(", ")
		await db.runAsync(
			`DELETE FROM sync_queue WHERE id IN (${placeholders})`,
			...ids
		)
	},
}
