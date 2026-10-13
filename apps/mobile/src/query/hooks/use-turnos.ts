import { useMutation, useQuery } from "@tanstack/react-query"
import {
	type CreateTurnoInput,
	turnoRepository,
} from "@/repositories/turno.repository"
import { useAfterEntityChange } from "@/sync/use-after-entity-change"
import { turnosKeys } from "../keys/turnos.keys"

export function useTurnos(userId: string | null | undefined) {
	return useQuery({
		queryKey: turnosKeys.byUserId(userId ?? ""),
		queryFn: () => turnoRepository.getAllByUserId(userId as string),
		enabled: Boolean(userId),
	})
}

export function useTurnoById(id: string | undefined) {
	return useQuery({
		queryKey: turnosKeys.byId(id ?? ""),
		queryFn: () => {
			if (!id) throw new Error("Turno ID requerido")
			return turnoRepository.getById(id)
		},
		enabled: Boolean(id),
	})
}

export function useCreateTurno() {
	const afterChange = useAfterEntityChange(turnosKeys.all)
	return useMutation({
		mutationFn: (input: CreateTurnoInput) => turnoRepository.create(input),
		onSuccess: () => afterChange(),
	})
}

export function useUpdateTurno() {
	const afterChange = useAfterEntityChange(turnosKeys.all)
	return useMutation({
		mutationFn: ({
			id,
			input,
		}: {
			id: string
			input: Partial<CreateTurnoInput>
		}) => turnoRepository.update(id, input),
		onSuccess: () => afterChange(),
	})
}

export function useDeleteTurno() {
	const afterChange = useAfterEntityChange(turnosKeys.all)
	return useMutation({
		mutationFn: (id: string) => turnoRepository.delete(id),
		onSuccess: () => afterChange(),
	})
}
