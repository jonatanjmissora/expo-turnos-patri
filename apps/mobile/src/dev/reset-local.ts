import { getDatabase } from "@/db/client"

/**
 * SOLO DESARROLLO. Borra los datos locales de negocio (turnos), la cola de sync
 * y las banderas (`app_meta`, incluye el flag de restore). No borra `users`
 * (espejo de la nube), así el login offline sigue funcionando.
 */
export async function resetLocalData(): Promise<void> {
	const db = await getDatabase()
	await db.execAsync(`
		DELETE FROM turnos;
		DELETE FROM sync_queue;
		DELETE FROM app_meta;
	`)
}
