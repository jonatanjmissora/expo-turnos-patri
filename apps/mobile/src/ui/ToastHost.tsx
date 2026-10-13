import { StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { colors, fontSize, radius, spacing } from "@/constants/theme"
import { useToasts } from "./toast"

const BACKGROUND: Record<string, string> = {
	info: colors.cell,
	success: "#CDEBD3",
	warning: "#FBE7B8",
	error: "#F5C2C2",
}

/** Banner de toasts (ej. "Sin conexión"). Se monta una vez en el `_layout`. */
export function ToastHost() {
	const toasts = useToasts()
	const insets = useSafeAreaInsets()

	if (toasts.length === 0) return null

	return (
		<View
			pointerEvents="none"
			style={[styles.container, { top: insets.top + spacing.sm }]}
		>
			{toasts.map(toast => (
				<View
					key={toast.id}
					style={[
						styles.toast,
						{ backgroundColor: BACKGROUND[toast.type] ?? colors.cell },
					]}
				>
					<Text style={styles.text}>{toast.message}</Text>
				</View>
			))}
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		position: "absolute",
		left: 0,
		right: 0,
		zIndex: 100,
		alignItems: "center",
		paddingHorizontal: spacing.lg,
	},
	toast: {
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: radius.md,
		paddingVertical: spacing.sm,
		paddingHorizontal: spacing.lg,
		marginBottom: spacing.sm,
		maxWidth: 480,
	},
	text: {
		color: colors.black,
		fontSize: fontSize.sm,
		fontWeight: "700",
		textAlign: "center",
	},
})
