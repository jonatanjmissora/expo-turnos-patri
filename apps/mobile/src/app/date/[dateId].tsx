import { Loading } from "@/components/Loading"
import { TurnoRow } from "@/components/calendar/TurnoRow"
import { colors, fontSize, radius, spacing } from "@/constants/theme"
import { useTurnos } from "@/query/hooks/use-turnos"
import { formatTurnos } from "@/services/format-turnos"
import { formatValor } from "@/services/format-valor"
import { getHeaderDay } from "@/services/header-day"
import { useUserId } from "@/session/session-context"
import { Feather } from "@expo/vector-icons"
import { Stack, useLocalSearchParams, useRouter } from "expo-router"
import { useMemo } from "react"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"

export default function DateTurnosScreen() {
	const router = useRouter()
	const params = useLocalSearchParams<{ dateId?: string }>()
	const dateId = params.dateId ?? ""
	const userId = useUserId()
	const { data, isLoading } = useTurnos(userId)

	const turnos = useMemo(() => {
		const grouped = formatTurnos(data)
		return (grouped[dateId] ?? []).sort((a, b) =>
			a.hora.localeCompare(b.hora)
		)
	}, [data, dateId])

	const total = turnos.reduce((acc, turno) => acc + turno.valor, 0)
	const { dayName, day, month } = getHeaderDay(dateId)

	return (
		<View style={styles.container}>
			<Stack.Screen options={{ title: `${dayName} ${day} ${month}` }} />
<Pressable
				style={styles.addButton}
				onPress={() =>
					router.push({ pathname: "/turno/nuevo", params: { fecha: dateId } })
				}
			>
				<Feather name="plus" size={14} color={colors.black} />
				<Text style={styles.addText}>Agregar turno</Text>
			</Pressable>
			{isLoading ? (
				<Loading label="Cargando..." />
			) : (
				<ScrollView contentContainerStyle={styles.content}>
					{turnos.length === 0 ? (
						<Text style={styles.empty}>No hay turnos para este día</Text>
					) : (
						turnos.map(turno => <TurnoRow key={turno.id} turno={turno} />)
					)}
					{turnos.length > 0 ? (
						<Text style={styles.total}>Total $ {formatValor(total)}</Text>
					) : null}
				</ScrollView>
			)}
			

		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.background,
	},
	content: {
		padding: spacing.md,
		gap: spacing.sm,
	},
	empty: {
		textAlign: "center",
		color: colors.muted,
		marginTop: spacing.xl,
		fontSize: fontSize.md,
	},
	total: {
		textAlign: "right",
		fontWeight: "700",
		color: colors.black,
		fontSize: fontSize.md,
		marginTop: spacing.sm,
		paddingRight: spacing.xs,
	},
	addButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		alignSelf: "flex-end",
		gap: spacing.sm,
		backgroundColor: colors.today,
		borderWidth: 1,
		borderColor: colors.border,
		paddingVertical: spacing.md,
		paddingHorizontal: spacing.md,
		borderRadius: radius.sm,
		margin: spacing.md,
	},
	addText: {
		fontWeight: "700",
		fontSize: fontSize.sm,
		color: colors.black,
	},
})
