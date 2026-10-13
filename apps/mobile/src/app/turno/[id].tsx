import { Stack, useLocalSearchParams, useRouter } from "expo-router"
import { useMemo } from "react"
import { StyleSheet, Text, View } from "react-native"
import { Loading } from "@/components/Loading"
import { TurnoForm, turnoToFormValues } from "@/components/form/TurnoForm"
import { colors, fontSize, spacing } from "@/constants/theme"
import { useTurnoById } from "@/query/hooks/use-turnos"

export default function EditarTurnoScreen() {
	const router = useRouter()
	const params = useLocalSearchParams<{ id: string }>()
	const { data: turno, isLoading } = useTurnoById(params.id)
	const initial = useMemo(
		() => (turno ? turnoToFormValues(turno) : null),
		[turno]
	)

	if (isLoading) {
		return (
			<View style={styles.flex}>
				<Stack.Screen options={{ title: "Editar turno" }} />
				<Loading label="Cargando..." />
			</View>
		)
	}

	if (!turno || !initial) {
		return (
			<View style={styles.flex}>
				<Stack.Screen options={{ title: "Editar turno" }} />
				<Text style={styles.notFound}>Turno no encontrado</Text>
			</View>
		)
	}

	return (
		<>
			<Stack.Screen options={{ title: "Editar turno" }} />
			<TurnoForm
				mode="edit"
				turnoId={turno.id}
				initial={initial}
				onSaved={() => router.back()}
				onCancel={() => router.back()}
			/>
		</>
	)
}

const styles = StyleSheet.create({
	flex: { flex: 1, backgroundColor: colors.background },
	notFound: {
		textAlign: "center",
		marginTop: spacing.xxl,
		fontSize: fontSize.md,
		color: colors.muted,
	},
})
