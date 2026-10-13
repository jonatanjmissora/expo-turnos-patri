import * as SQLite from "expo-sqlite"
import { CREATE_USERS_TABLE } from "./schema/users"
import { CREATE_TURNOS_TABLE } from "./schema/turnos"
import { CREATE_SYNC_QUEUE_TABLE } from "./schema/sync-queue"
import { CREATE_APP_META_TABLE } from "./schema/meta"

const DATABASE_NAME = "turnos.db"

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null

async function initializeDatabase(database: SQLite.SQLiteDatabase) {
	await database.execAsync(CREATE_USERS_TABLE)
	await database.execAsync(CREATE_TURNOS_TABLE)
	await database.execAsync(CREATE_SYNC_QUEUE_TABLE)
	await database.execAsync(CREATE_APP_META_TABLE)
}

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
	if (!dbPromise) {
		dbPromise = (async () => {
			const database = await SQLite.openDatabaseAsync(DATABASE_NAME)
			await initializeDatabase(database)
			return database
		})()
	}

	return dbPromise
}
