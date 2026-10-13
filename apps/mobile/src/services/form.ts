import type { TurnoType } from "@/db/schema/turnos"
import { DEPILACION_OPTIONS } from "@/constants/tratamientos"

/**
 * Normaliza la hora a 4 dígitos y valida el rango. Devuelve `null` si es
 * inválida. Portado de `formUtils.checkHoraFormat`.
 */
export function checkHoraFormat(hora: string): string | null {
	let value = hora.trim()
	while (value.length < 4) value = `0${value}`

	const hours = Number.parseInt(value.substring(0, 2), 10)
	const minutes = Number.parseInt(value.substring(2, 4), 10)

	if (Number.isNaN(hours) || Number.isNaN(minutes)) return null
	if (hours < 24 && minutes < 60) return value
	return null
}

/** Formatea 'HHMM' -> 'HH:MM'. */
export function formatHora(hora: string): string {
	const padded = hora.padStart(4, "0")
	return `${padded.substring(0, 2)}:${padded.substring(2, 4)}`
}

/** Minutos desde las 00:00 a partir de 'HHMM'. */
function horaToMinutes(hora: string): number {
	const padded = hora.padStart(4, "0")
	return (
		Number.parseInt(padded.substring(0, 2), 10) * 60 +
		Number.parseInt(padded.substring(2, 4), 10)
	)
}

/** Minutos -> 'HHMM'. */
function minutesToHora(minutes: number): string {
	const hours = Math.floor(minutes / 60)
	const mins = minutes % 60
	return `${String(hours).padStart(2, "0")}${String(mins).padStart(2, "0")}`
}

export type TurnoConflict = {
	conflict: TurnoType | null
	message: string
}

/**
 * Detecta solapamiento de un turno contra los turnos de un día.
 * Función pura (portada de `useForm.checkTurnoInConflict`, sin DOM).
 */
export function checkTurnoInConflict(
	hora: string,
	duracion: number,
	turnosDelDia: TurnoType[],
	excludeId?: string,
): TurnoConflict {
	const newStart = horaToMinutes(hora)
	const newEnd = newStart + duracion

	const others = excludeId
		? turnosDelDia.filter(turno => turno.id !== excludeId)
		: turnosDelDia

	const conflict =
		others.find(turno => {
			const start = horaToMinutes(turno.hora)
			const end = start + turno.duracion
			return (
				(newStart >= start && newStart < end) ||
				(newEnd > start && newEnd <= end) ||
				(newStart <= start && newEnd >= end)
			)
		}) ?? null

	if (!conflict) return { conflict: null, message: "" }

	const conflictStart = horaToMinutes(conflict.hora)
	const conflictEnd = conflictStart + conflict.duracion
	const message = `CONFLICTO: ${formatHora(conflict.hora)} - ${minutesToHora(
		conflictEnd,
	)}  ${conflict.nombre}  ${conflict.tratamiento}`

	return { conflict, message }
}

/**
 * Resuelve el texto final del tratamiento y si es depilación.
 * Portado de `formUtils.getTratamiento`, pero recibiendo las opciones de
 * depilación como estado de React (la web leía el DOM).
 */
export function buildTratamiento(
	tratamiento: string,
	otro: string,
	depilacion: string[],
): { tratamiento: string; isDepi: boolean } {
	if (tratamiento === "depilacion") {
		const validas = DEPILACION_OPTIONS.filter(option =>
			depilacion.includes(option),
		)
		return { tratamiento: validas.join(" / "), isDepi: true }
	}
	if (tratamiento === "otro") {
		return { tratamiento: otro.trim(), isDepi: false }
	}
	return { tratamiento, isDepi: false }
}

/** Dado un tratamiento guardado, deduce si es de depilación. */
export function isTratamientoDepi(tratamiento: string): boolean {
	if (!tratamiento) return false
	return tratamiento
		.split("/")
		.map(part => part.trim())
		.every(part => (DEPILACION_OPTIONS as readonly string[]).includes(part))
}
