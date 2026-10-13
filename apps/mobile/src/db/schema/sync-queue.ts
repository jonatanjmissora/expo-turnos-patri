export const CREATE_SYNC_QUEUE_TABLE = `
	CREATE TABLE IF NOT EXISTS sync_queue (
		id         TEXT PRIMARY KEY NOT NULL,
		userId     TEXT NOT NULL,
		entity     TEXT NOT NULL,
		recordId   TEXT NOT NULL,
		operation  TEXT NOT NULL,
		createdAt  TEXT NOT NULL
	);
	CREATE UNIQUE INDEX IF NOT EXISTS idx_sync_queue_key
		ON sync_queue (userId, entity, recordId);
`
