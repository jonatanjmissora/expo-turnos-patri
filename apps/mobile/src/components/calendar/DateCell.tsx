import { useRouter } from "expo-router"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { colors, fontSize, radius, spacing } from "@/constants/theme"
import type { TurnoType } from "@/db/schema/turnos"

type Props = {
	fecha: string
	inMonth: boolean
	isToday: boolean
	turnosDelDia: TurnoType[]
}

export function DateCell({ fecha, inMonth, isToday, turnosDelDia }: Props) {
	const router = useRouter()
	const dayNum = String(Number(fecha.split("-")[2]))

	if (!inMonth) return <View style={styles.placeholder} />

	const turnosCount = turnosDelDia.filter(t => !t.isDepi).length
	const depiCount = turnosDelDia.filter(t => t.isDepi).length

	const handlePress = () => {
		if (turnosDelDia.length > 0) {
			router.push({ pathname: "/date/[dateId]", params: { dateId: fecha } })
		} else {
			router.push({ pathname: "/turno/nuevo", params: { fecha } })
		}
	}

	return (
		<Pressable onPress={handlePress} style={styles.cell}>
			<View style={[styles.dayNum, isToday && styles.dayNumToday]}>
				<Text style={styles.dayNumText}>{dayNum}</Text>
			</View>

			<View style={styles.counts}>
				{turnosCount > 0 ? (
					<View style={[styles.countPill, styles.countTurno]}>
						<Text style={styles.countText}>{turnosCount}</Text>
					</View>
				) : null}
				{depiCount > 0 ? (
					<View style={[styles.countPill, styles.countDepi]}>
						<Text style={styles.countText}>{depiCount}</Text>
					</View>
				) : null}
			</View>
		</Pressable>
	)
}

const styles = StyleSheet.create({
	placeholder: {
		flex: 1,
		margin: 2,
	},
	cell: {
		flex: 1,
		minHeight: 56,
		backgroundColor: colors.cell,
		margin: 2,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: radius.md,
		overflow: "hidden",
	},
	dayNum: {
		alignSelf: "center",
		marginTop: spacing.xs,
		paddingHorizontal: spacing.xs,
		borderRadius: radius.pill,
		borderWidth: 1,
		borderColor: colors.transparent,
	},
	dayNumToday: {
		backgroundColor: colors.today,
		borderColor: colors.muted,
	},
	dayNumText: {
		fontWeight: "700",
		fontSize: fontSize.sm,
		color: colors.black,
	},
	counts: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "center",
		gap: spacing.xs,
		marginTop: spacing.xs,
		marginBottom: spacing.xs,
	},
	countPill: {
		minWidth: 22,
		paddingHorizontal: spacing.xs,
		paddingVertical: 2,
		borderRadius: radius.sm,
		alignItems: "center",
	},
	countTurno: {
		backgroundColor: colors.turno,
	},
	countDepi: {
		backgroundColor: colors.depi,
	},
	countText: {
		fontWeight: "700",
		fontSize: fontSize.xs,
		color: colors.black,
	},
})
