import { getDatabase } from "@/db/client"
import { appMetaRepository } from "@/repositories/app-meta.repository"
import { syncQueueRepository } from "@/repositories/sync-queue.repository"
import { getActualDate, dateToFecha } from "@/services/date"

/** Retención local de turnos (días), en paridad con el purge de Neon. */
const RETENTION_DAYS = 365
const LAST_PURGE_KEY = "last_purge_date"

/**
 * Borra de SQLite los turnos con `fecha` a más de 365 días y encola un `delete`
 * por cada uno, para que la nube converja sin esperar al cron semanal.
 * Devuelve cuántos turnos se purgaron.
 */
export async function purgeOldTurnos(userId: string): Promise<number> {
	const cutoff = new Date()
	cutoff.setDate(cutoff.getDate() - RETENTION_DAYS)
	const cutoffStr = dateToFecha(cutoff)

	const db = await getDatabase()
	const rows = await db.getAllAsync<{ id: string }>(
		`SELECT id FROM turnos WHERE userId = ? AND fecha < ?`,
		userId,
		cutoffStr
	)
	if (rows.length === 0) return 0

	await db.runAsync(
		`DELETE FROM turnos WHERE userId = ? AND fecha < ?`,
		userId,
		cutoffStr
	)

	for (const row of rows) {
		await syncQueueRepository.enqueue(userId, "turnos", row.id, "delete")
	}

	return rows.length
}

/**
 * Corre la purga **como máximo una vez por día** (bandera en `app_meta`).
 * Pensada para llamarse al arrancar la app y al volver a primer plano.
 */
export async function purgeOldTurnosIfDue(userId: string): Promise<number> {
	const today = getActualDate()
	const last = await appMetaRepository.get(LAST_PURGE_KEY)
	if (last === today) return 0

	const purged = await purgeOldTurnos(userId)
	await appMetaRepository.set(LAST_PURGE_KEY, today)
	return purged
}
