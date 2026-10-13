import { ActivityIndicator, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { colors, fontSize, radius, spacing } from "@/constants/theme"
import { useSyncActivity } from "@/sync/sync-activity"

/** Barra de progreso global de sync. Se monta una vez en el `_layout`. */
export function SyncProgressBar() {
	const { active, sections } = useSyncActivity()
	const insets = useSafeAreaInsets()

	if (!active) return null

	const done = sections.reduce((acc, section) => acc + section.done, 0)

	return (
		<View style={[styles.container, { top: insets.top + spacing.sm }]}>
			<ActivityIndicator size="small" color={colors.black} />
			<Text style={styles.text}>
				Sincronizando{done > 0 ? ` (${done})` : ""}…
			</Text>
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
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: spacing.sm,
		backgroundColor: colors.today,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: radius.md,
		paddingVertical: spacing.xs,
	},
	text: {
		color: colors.black,
		fontSize: fontSize.sm,
		fontWeight: "700",
	},
})
