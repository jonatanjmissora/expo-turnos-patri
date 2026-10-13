import { Stack, useLocalSearchParams, useRouter } from "expo-router"
import { useMemo } from "react"
import { TurnoForm } from "@/components/form/TurnoForm"
import { defaultTurno } from "@/db/schema/turnos"
import { getActualDate } from "@/services/date"

export default function NuevoTurnoScreen() {
	const router = useRouter()
	const params = useLocalSearchParams<{ fecha?: string }>()
	const fecha = params.fecha ?? getActualDate()
	const initial = useMemo(() => defaultTurno(fecha), [fecha])

	return (
		<>
			<Stack.Screen options={{ title: "Nuevo turno" }} />
			<TurnoForm
				mode="create"
				initial={initial}
				onSaved={() => router.back()}
				onCancel={() => router.back()}
			/>
		</>
	)
}
