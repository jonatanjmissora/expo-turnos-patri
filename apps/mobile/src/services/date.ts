/** Fecha de hoy en formato `YYYY-MM-DD` (hora local). */
export function getActualDate(): string {
	const now = new Date()
	const year = now.getFullYear()
	const month = String(now.getMonth() + 1).padStart(2, "0")
	const day = String(now.getDate()).padStart(2, "0")
	return `${year}-${month}-${day}`
}

/** `YYYY-MM-DD` -> `YYYYMMDD`. */
export function fechaToId(fecha: string): string {
	return fecha.split("-").join("")
}

/** `YYYYMMDD` -> `YYYY-MM-DD`. */
export function idToFecha(id: string): string {
	return `${id.substring(0, 4)}-${id.substring(4, 6)}-${id.substring(6, 8)}`
}

/** Convierte un `Date` a `YYYY-MM-DD` (hora local). */
export function dateToFecha(date: Date): string {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, "0")
	const day = String(date.getDate()).padStart(2, "0")
	return `${year}-${month}-${day}`
}

/** Parsea `YYYY-MM-DD` a un `Date` local (sin desfase de zona horaria). */
export function fechaToDate(fecha: string): Date {
	const [year, month, day] = fecha.split("-").map(Number)
	return new Date(year, (month ?? 1) - 1, day ?? 1)
}
