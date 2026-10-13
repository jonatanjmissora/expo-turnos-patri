import type { TurnosByDate } from "./format-turnos"

export type ClientaTurno = {
	id: string
	fecha: string
	tratamiento: string
	valor: number
	isDepi: boolean
}

export type ClientasMap = Record<string, ClientaTurno[]>

export type ClientasResult = {
	clientas: ClientasMap
	nombres: string[]
}

/**
 * Vista derivada de los turnos: agrupa por nombre de clienta y ordena
 * alfabéticamente. Portado de `getClientas.js` (sin contextos).
 */
export function getClientas(turnos: TurnosByDate): ClientasResult {
	const clientas: ClientasMap = {}

	for (const turnosDelDia of Object.values(turnos)) {
		for (const turno of turnosDelDia) {
			clientas[turno.nombre] = clientas[turno.nombre] ?? []
			clientas[turno.nombre].push({
				id: turno.id,
				fecha: turno.fecha,
				tratamiento: turno.tratamiento,
				valor: turno.valor,
				isDepi: turno.isDepi,
			})
		}
	}

	const nombres = Object.keys(clientas).sort((a, b) => a.localeCompare(b))

	return { clientas, nombres }
}
