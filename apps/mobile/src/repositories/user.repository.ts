import { getDatabase } from "../db/client"
import { CREATE_USERS_TABLE } from "../db/schema/users"

export type UserType = {
	id: string
	email: string
	name: string | null
	userImage: string | null
	passwordHash: string | null
	createdAt: string
	updatedAt: string
}

export type UpdateUserInput = {
	email?: string
	name?: string | null
	userImage?: string | null
}

export type CloudUserInput = {
	id: string
	email: string
	name: string | null
	userImage: string | null
}

const SELECT_COLUMNS = `
	id,
	email,
	name,
	userImage,
	passwordHash,
	createdAt,
	updatedAt
`

async function initializeUsersTable() {
	const db = await getDatabase()
	await db.execAsync(CREATE_USERS_TABLE)
}

export const userRepository = {
	/**
	 * Espejo local del usuario de la nube. En el primer alta crea la fila; si
	 * ya existe, actualiza solo los campos que la nube provee (COALESCE), para
	 * no pisar un `name`/`userImage` local con un null de la nube.
	 */
	async upsertFromCloud(
		input: CloudUserInput,
		passwordHash?: string | null
	): Promise<UserType> {
		await initializeUsersTable()

		const db = await getDatabase()
		const now = new Date().toISOString()

		await db.runAsync(
			`
				INSERT INTO users (id, email, name, userImage, passwordHash, createdAt, updatedAt)
				VALUES (?, ?, ?, ?, ?, ?, ?)
				ON CONFLICT(id) DO UPDATE SET
					email = excluded.email,
					name = COALESCE(excluded.name, users.name),
					userImage = COALESCE(excluded.userImage, users.userImage),
					passwordHash = COALESCE(excluded.passwordHash, users.passwordHash),
					updatedAt = excluded.updatedAt
			`,
			input.id,
			input.email,
			input.name,
			input.userImage,
			passwordHash ?? null,
			now,
			now
		)

		const user = await db.getFirstAsync<UserType>(
			`SELECT ${SELECT_COLUMNS} FROM users WHERE id = ?`,
			input.id
		)

		if (!user) {
			throw new Error("No se pudo recuperar el usuario")
		}

		return user
	},

	async getByEmail(email: string): Promise<UserType | null> {
		await initializeUsersTable()

		const db = await getDatabase()
		const user = await db.getFirstAsync<UserType>(
			`SELECT ${SELECT_COLUMNS} FROM users WHERE email = ? LIMIT 1`,
			email
		)

		return user ?? null
	},

	async getById(id: string): Promise<UserType | null> {
		await initializeUsersTable()

		const db = await getDatabase()
		const user = await db.getFirstAsync<UserType>(
			`SELECT ${SELECT_COLUMNS} FROM users WHERE id = ?`,
			id
		)

		return user ?? null
	},

	/** ¿Existe al menos un usuario registrado en este dispositivo? */
	async hasAny(): Promise<boolean> {
		await initializeUsersTable()

		const db = await getDatabase()
		const row = await db.getFirstAsync<{ cnt: number }>(
			`SELECT COUNT(*) AS cnt FROM users`
		)

		return (row?.cnt ?? 0) > 0
	},

	/** Actualiza el hash local (login offline) tras un reset de contraseña. */
	async updatePasswordHash(email: string, passwordHash: string): Promise<void> {
		await initializeUsersTable()

		const db = await getDatabase()
		await db.runAsync(
			`UPDATE users SET passwordHash = ?, updatedAt = ? WHERE email = ?`,
			passwordHash,
			new Date().toISOString(),
			email
		)
	},

	async update(id: string, input: UpdateUserInput): Promise<UserType> {
		await initializeUsersTable()

		const db = await getDatabase()

		const existing = await db.getFirstAsync<UserType>(
			`SELECT ${SELECT_COLUMNS} FROM users WHERE id = ? LIMIT 1`,
			id
		)
		if (!existing) {
			throw new Error("No se encontró el usuario a actualizar")
		}

		const user: UserType = {
			...existing,
			...input,
			updatedAt: new Date().toISOString(),
		}

		await db.runAsync(
			`
				UPDATE users SET
					email = ?,
					name = ?,
					userImage = ?,
					updatedAt = ?
				WHERE id = ?
			`,
			user.email,
			user.name,
			user.userImage,
			user.updatedAt,
			id
		)

		return user
	},
}
