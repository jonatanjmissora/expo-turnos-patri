import { z } from "zod"
import { TRATAMIENTO_OPTIONS } from "@/constants/tratamientos"

export const CREATE_TURNOS_TABLE = `
	CREATE TABLE IF NOT EXISTS turnos (
		id          TEXT PRIMARY KEY NOT NULL,
		userId      TEXT NOT NULL,
		fecha       TEXT NOT NULL,
		hora        TEXT NOT NULL,
		duracion    INTEGER NOT NULL,
		nombre      TEXT NOT NULL,
		tratamiento TEXT NOT NULL,
		isDepi      INTEGER NOT NULL DEFAULT 0,
		valor       INTEGER NOT NULL,
		createdAt   TEXT NOT NULL,
		updatedAt   TEXT NOT NULL
	);
	CREATE INDEX IF NOT EXISTS idx_turnos_user_fecha
		ON turnos (userId, fecha);
`

export type TurnoType = {
	id: string
	userId: string
	/** 'YYYY-MM-DD' */
	fecha: string
	/** 'HHMM' */
	hora: string
	/** minutos */
	duracion: number
	nombre: string
	tratamiento: string
	isDepi: boolean
	valor: number
	createdAt: string
	updatedAt: string
}

export const turnoFormValidator = z.object({
	fecha: z.string().min(1, "Seleccione una fecha"),
	hora: z.string().min(1, "Ingrese la hora"),
	duracion: z.number().int().min(0),
	nombre: z.string().min(1, "Ingrese el nombre"),
	tratamiento: z.enum(TRATAMIENTO_OPTIONS),
	/** Opciones de depilación seleccionadas (solo si tratamiento = 'depilacion'). */
	depilacion: z.array(z.string()),
	/** Texto libre (solo si tratamiento = 'otro'). */
	otro: z.string(),
	valor: z.string(),
})

export type TurnoFormType = z.infer<typeof turnoFormValidator>

export function defaultTurno(fecha: string): TurnoFormType {
	return {
		fecha,
		hora: "",
		duracion: 15,
		nombre: "",
		tratamiento: "maderoterapia",
		depilacion: [],
		otro: "",
		valor: "",
	}
}
