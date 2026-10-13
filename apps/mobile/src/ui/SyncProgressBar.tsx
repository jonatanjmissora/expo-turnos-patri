import { ActivityIndicator, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { colors, fontSize, radius, spacing } from "@/constants/theme"
import { useSyncActivity } from "@/sync/sync-activity"

/** Barra de progreso global de sync. Se monta una vez en el `_layout`. */
export function SyncProgressBar() {
	const { active, done, total } = useSyncActivity()
	const insets = useSafeAreaInsets()

	if (!active) return null

	const determinate = total > 0
	const progress = determinate ? Math.min(1, done / total) : 0

	return (
		<View style={[styles.container, { top: insets.top + spacing.sm }]}>
			<View style={styles.row}>
				<Text style={styles.text}>Sincronizando…</Text>
				{determinate ? (
					<Text style={styles.count}>
						{done}/{total}
					</Text>
				) : (
					<ActivityIndicator size="small" color={colors.muted} />
				)}
			</View>
			<View style={styles.track}>
				<View
					style={[
						styles.fill,
						determinate
							? { width: `${Math.round(progress * 100)}%` }
							: styles.indeterminate,
					]}
				/>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		position: "absolute",
		alignSelf: "center",
		left: spacing.lg,
		right: spacing.lg,
		zIndex: 99,
		backgroundColor: colors.white,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: radius.md,
		paddingVertical: spacing.sm,
		paddingHorizontal: spacing.md,
		gap: spacing.xs,
	},
	row: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	text: {
		color: colors.black,
		fontSize: fontSize.sm,
		fontWeight: "700",
	},
	count: {
		color: colors.muted,
		fontSize: fontSize.xs,
		fontWeight: "700",
	},
	track: {
		height: 6,
		backgroundColor: colors.cell,
		borderRadius: radius.pill,
		overflow: "hidden",
		justifyContent: "center",
	},
	fill: {
		height: "100%",
		backgroundColor: colors.turno,
		borderRadius: radius.pill,
	},
	indeterminate: {
		width: "40%",
		opacity: 0.7,
	},
})
