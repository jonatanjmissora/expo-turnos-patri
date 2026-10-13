import { getDatabase } from "../db/client"
import { CREATE_APP_META_TABLE } from "../db/schema/meta"

async function init() {
	const db = await getDatabase()
	await db.execAsync(CREATE_APP_META_TABLE)
}

/** Key-value local (chico) para banderas de la app. Se borra al reinstalar. */
export const appMetaRepository = {
	async get(key: string): Promise<string | null> {
		await init()
		const db = await getDatabase()
		const row = await db.getFirstAsync<{ value: string }>(
			`SELECT value FROM app_meta WHERE key = ?`,
			key
		)
		return row?.value ?? null
	},

	async set(key: string, value: string): Promise<void> {
		await init()
		const db = await getDatabase()
		await db.runAsync(
			`INSERT INTO app_meta (key, value) VALUES (?, ?)
			 ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
			key,
			value
		)
	},

	async remove(key: string): Promise<void> {
		await init()
		const db = await getDatabase()
		await db.runAsync(`DELETE FROM app_meta WHERE key = ?`, key)
	},
}
