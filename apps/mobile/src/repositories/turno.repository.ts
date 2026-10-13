import { randomUUID } from "expo-crypto"
import { getDatabase } from "../db/client"
import { CREATE_TURNOS_TABLE, type TurnoType } from "../db/schema/turnos"

export type CreateTurnoInput = {
	userId: string
	fecha: string
	hora: string
	duracion: number
	nombre: string
	tratamiento: string
	isDepi: boolean
	valor: number
}

type TurnoRow = {
	id: string
	userId: string
	fecha: string
	hora: string
	duracion: number
	nombre: string
	tratamiento: string
	isDepi: number
	valor: number
	createdAt: string
	updatedAt: string
}

const SELECT_COLUMNS = `
	id,
	userId,
	fecha,
	hora,
	duracion,
	nombre,
	tratamiento,
	isDepi,
	valor,
	createdAt,
	updatedAt
`

function mapRow(row: TurnoRow): TurnoType {
	return { ...row, isDepi: row.isDepi === 1 }
}

async function initializeTurnosTable() {
	const db = await getDatabase()
	await db.execAsync(CREATE_TURNOS_TABLE)
}

export const turnoRepository = {
	async create(input: CreateTurnoInput): Promise<TurnoType> {
		await initializeTurnosTable()

		const db = await getDatabase()
		const id = randomUUID()
		const now = new Date().toISOString()

		await db.runAsync(
			`
				INSERT INTO turnos (
					id, userId, fecha, hora, duracion, nombre, tratamiento,
					isDepi, valor, createdAt, updatedAt
				)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			`,
			id,
			input.userId,
			input.fecha,
			input.hora,
			input.duracion,
			input.nombre,
			input.tratamiento,
			input.isDepi ? 1 : 0,
			input.valor,
			now,
			now
		)

		const turno = await db.getFirstAsync<TurnoRow>(
			`SELECT ${SELECT_COLUMNS} FROM turnos WHERE id = ?`,
			id
		)

		if (!turno) {
			throw new Error("No se pudo recuperar el turno creado")
		}

		return mapRow(turno)
	},

	async getById(id: string): Promise<TurnoType | null> {
		await initializeTurnosTable()

		const db = await getDatabase()
		const turno = await db.getFirstAsync<TurnoRow>(
			`SELECT ${SELECT_COLUMNS} FROM turnos WHERE id = ?`,
			id
		)

		return turno ? mapRow(turno) : null
	},

	async getAllByUserId(userId: string): Promise<TurnoType[]> {
		await initializeTurnosTable()

		const db = await getDatabase()
		const rows = await db.getAllAsync<TurnoRow>(
			`SELECT ${SELECT_COLUMNS} FROM turnos WHERE userId = ?
			 ORDER BY fecha ASC, hora ASC`,
			userId
		)

		return (rows ?? []).map(mapRow)
	},

	async getByFecha(userId: string, fecha: string): Promise<TurnoType[]> {
		await initializeTurnosTable()

		const db = await getDatabase()
		const rows = await db.getAllAsync<TurnoRow>(
			`SELECT ${SELECT_COLUMNS} FROM turnos WHERE userId = ? AND fecha = ?
			 ORDER BY hora ASC`,
			userId,
			fecha
		)

		return (rows ?? []).map(mapRow)
	},

	async update(
		id: string,
		input: Partial<CreateTurnoInput>
	): Promise<TurnoType> {
		await initializeTurnosTable()

		const db = await getDatabase()

		const existing = await db.getFirstAsync<TurnoRow>(
			`SELECT ${SELECT_COLUMNS} FROM turnos WHERE id = ? LIMIT 1`,
			id
		)
		if (!existing) {
			throw new Error("No se encontró el turno a actualizar")
		}

		const turno: TurnoType = {
			...mapRow(existing),
			...input,
			updatedAt: new Date().toISOString(),
		}

		await db.runAsync(
			`
				UPDATE turnos SET
					userId = ?, fecha = ?, hora = ?, duracion = ?, nombre = ?,
					tratamiento = ?, isDepi = ?, valor = ?, updatedAt = ?
				WHERE id = ?
			`,
			turno.userId,
			turno.fecha,
			turno.hora,
			turno.duracion,
			turno.nombre,
			turno.tratamiento,
			turno.isDepi ? 1 : 0,
			turno.valor,
			turno.updatedAt,
			id
		)

		return turno
	},

	async delete(id: string): Promise<void> {
		await initializeTurnosTable()

		const db = await getDatabase()
		await db.runAsync(`DELETE FROM turnos WHERE id = ?`, id)
	},
}
