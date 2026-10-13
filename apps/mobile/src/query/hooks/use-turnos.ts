import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
	type CreateTurnoInput,
	turnoRepository,
} from "@/repositories/turno.repository"
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
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (input: CreateTurnoInput) => turnoRepository.create(input),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: turnosKeys.all }),
	})
}

export function useUpdateTurno() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({
			id,
			input,
		}: {
			id: string
			input: Partial<CreateTurnoInput>
		}) => turnoRepository.update(id, input),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: turnosKeys.all }),
	})
}

export function useDeleteTurno() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => turnoRepository.delete(id),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: turnosKeys.all }),
	})
}
