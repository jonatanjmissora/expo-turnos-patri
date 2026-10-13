import { fechaToDate } from "./date"

const DAYS = [
	"Domingo",
	"Lunes",
	"Martes",
	"Miercoles",
	"Jueves",
	"Viernes",
	"Sabado",
] as const

const MONTHS = [
	"Ene",
	"Feb",
	"Mar",
	"Abr",
	"May",
	"Jun",
	"Jul",
	"Ago",
	"Sep",
	"Oct",
	"Nov",
	"Dic",
] as const

export type HeaderDay = {
	dayName: string
	day: string
	month: string
}

/** Día/mes en español a partir de `YYYY-MM-DD` (sin desfase de UTC). */
export function getHeaderDay(fecha: string): HeaderDay {
	const date = fechaToDate(fecha)
	return {
		dayName: DAYS[date.getDay()],
		day: String(date.getDate()),
		month: MONTHS[date.getMonth()],
	}
}
