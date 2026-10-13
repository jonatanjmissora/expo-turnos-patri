import type { TurnoType } from "@/db/schema/turnos"

export type TurnosByDate = Record<string, TurnoType[]>

/** Agrupa una lista de turnos por fecha (`YYYY-MM-DD`). */
export function formatTurnos(turnos: TurnoType[] | null | undefined): TurnosByDate {
	const grouped: TurnosByDate = {}
	for (const turno of turnos ?? []) {
		grouped[turno.fecha] = grouped[turno.fecha] ?? []
		grouped[turno.fecha].push(turno)
	}
	return grouped
}
