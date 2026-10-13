import { ActivityIndicator, StyleSheet, Text, View } from "react-native"
import { colors, fontSize, spacing } from "@/constants/theme"

type Props = {
	label?: string
}

export function Loading({ label }: Props) {
	return (
		<View style={styles.container}>
			<ActivityIndicator color={colors.black} size="large" />
			{label ? <Text style={styles.label}>{label}</Text> : null}
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		gap: spacing.md,
	},
	label: {
		fontSize: fontSize.md,
		fontWeight: "700",
		color: colors.muted,
	},
})
