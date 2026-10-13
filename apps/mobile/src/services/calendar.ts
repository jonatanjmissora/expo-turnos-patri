export const MONTH_NAMES = [
	"ENERO",
	"FEBRERO",
	"MARZO",
	"ABRIL",
	"MAYO",
	"JUNIO",
	"JULIO",
	"AGOSTO",
	"SEPTIEMBRE",
	"OCTUBRE",
	"NOVIEMBRE",
	"DICIEMBRE",
] as const

function toFecha(date: Date): string {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, "0")
	const day = String(date.getDate()).padStart(2, "0")
	return `${year}-${month}-${day}`
}

/** Índice del lunes (0) en `Date.getDay()` (donde domingo = 0). */
function mondayOffset(date: Date): number {
	return (date.getDay() + 6) % 7
}

/**
 * Genera las semanas (Lunes a Sábado) del mes indicado.
 * `month` es 1-based (1 = enero). Reemplaza el objeto `MESES` precomputado del
 * repo web, incluyendo los días de los meses vecinos para completar la grilla.
 */
export function getMonthWeeks(year: number, month: number): string[][] {
	const first = new Date(year, month - 1, 1)
	const last = new Date(year, month, 0)

	const start = new Date(first)
	start.setDate(first.getDate() - mondayOffset(first))

	const end = new Date(last)
	end.setDate(last.getDate() + (6 - mondayOffset(last)))

	const weeks: string[][] = []
	const cursor = new Date(start)

	while (cursor <= end) {
		const week: string[] = []
		for (let i = 0; i < 6; i++) {
			week.push(toFecha(cursor))
			cursor.setDate(cursor.getDate() + 1)
		}
		weeks.push(week)
		cursor.setDate(cursor.getDate() + 1)
	}

	return weeks
}
