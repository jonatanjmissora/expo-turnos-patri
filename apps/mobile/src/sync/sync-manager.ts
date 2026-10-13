import { apiSyncPush } from "@/api/client"
import { getLocalEntity, LOCAL_ENTITIES } from "@/db/local-entities"
import {
	recordToCloud,
	syncLocalRepository,
} from "@/repositories/sync-local.repository"
import { syncQueueRepository } from "@/repositories/sync-queue.repository"
import { showToast } from "@/ui/toast"
import { isOffline } from "@/utils/network"
import {
	finishSyncActivity,
	setSyncProgress,
	startSyncActivity,
} from "./sync-activity"

export type SyncResult = {
	synced: number
	remaining: number
}

/** Lock por `userId:entity` para no correr dos flushes en paralelo. */
const locks = new Map<string, Promise<number>>()

async function countPending(userId: string, entityKey?: string): Promise<number> {
	if (!entityKey) return syncQueueRepository.getCountByUserId(userId)
	const entries = await syncQueueRepository.getAllByUserId(userId)
	return entries.filter(entry => entry.entity === entityKey).length
}

async function flushEntityQueue(
	entityKey: string,
	userId: string
): Promise<number> {
	let synced = 0
	let lastCount = Number.POSITIVE_INFINITY

	for (;;) {
		const pending = (await syncQueueRepository.getAllByUserId(userId)).filter(
			entry => entry.entity === entityKey
		)
		if (pending.length === 0) break
		// Anti-loop: si la cola no baja, cortamos.
		if (pending.length >= lastCount) break
		lastCount = pending.length

		const upserts: Record<string, unknown>[] = []
		const deletes: string[] = []
		const doneIds: string[] = []

		for (const entry of pending) {
			if (entry.operation === "upsert") {
				const record = await syncLocalRepository.getById(
					entityKey,
					entry.recordId
				)
				if (record) {
					upserts.push(recordToCloud(entityKey, record))
					doneIds.push(entry.id)
					continue
				}
				// Upsert de un registro que ya no existe → se manda como delete.
			}
			deletes.push(entry.recordId)
			doneIds.push(entry.id)
		}

		if (upserts.length === 0 && deletes.length === 0) break

		await apiSyncPush(entityKey, { upserts, deletes })
		await syncQueueRepository.removeMany(doneIds)
		synced += doneIds.length
	}

	return synced
}

/** Vacía la cola de una entidad. */
export async function flushEntity(
	entityKey: string,
	userId: string,
	options: { notify?: boolean } = {}
): Promise<SyncResult> {
	const lockKey = `${userId}:${entityKey}`
	const existing = locks.get(lockKey)
	if (existing) {
		const synced = await existing
		const remaining = await countPending(userId)
		return { synced, remaining }
	}

	const task = (async (): Promise<number> => {
		if (await isOffline()) return 0
		const entity = getLocalEntity(entityKey)
		if (options.notify && entity) {
			startSyncActivity(await countPending(userId, entityKey))
		}
		try {
			const synced = await flushEntityQueue(entityKey, userId)
			if (options.notify) setSyncProgress(synced)
			return synced
		} finally {
			if (options.notify) finishSyncActivity()
		}
	})()

	locks.set(lockKey, task)
	try {
		const synced = await task
		const remaining = await countPending(userId)
		return { synced, remaining }
	} finally {
		locks.delete(lockKey)
	}
}

/** Vacía la cola de todas las entidades del usuario. */
export async function flushAll(
	userId: string,
	options: { notify?: boolean } = {}
): Promise<SyncResult> {
	if (await isOffline()) {
		const remaining = await countPending(userId)
		if (remaining > 0 && options.notify) {
			showToast("Sin conexión. Se sincronizará al volver online.", "warning")
		}
		return { synced: 0, remaining }
	}

	const total = await countPending(userId)
	if (options.notify && total > 0) startSyncActivity(total)

	let synced = 0
	try {
		for (const entity of LOCAL_ENTITIES) {
			const result = await flushEntity(entity.key, userId, { notify: false })
			synced += result.synced
			if (options.notify) setSyncProgress(synced)
		}
	} finally {
		if (options.notify) finishSyncActivity()
	}

	const remaining = await countPending(userId)
	return { synced, remaining }
}
