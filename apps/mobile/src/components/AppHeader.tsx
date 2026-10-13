import { Feather } from "@expo/vector-icons"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { colors, fontSize, spacing } from "@/constants/theme"
import { useSession } from "@/session/session-context"

type Props = {
	title: string
}

export function AppHeader({ title }: Props) {
	const { signOut } = useSession()

	return (
		<View style={styles.header}>
			<Text style={styles.title}>{title}</Text>
			<Pressable onPress={signOut} hitSlop={10} style={styles.logout}>
				<Feather name="log-out" size={22} color={colors.black} />
			</Pressable>
		</View>
	)
}

const styles = StyleSheet.create({
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: spacing.lg,
		paddingVertical: spacing.md,
	},
	title: {
		fontSize: fontSize.lg,
		fontWeight: "700",
		letterSpacing: 2,
		color: colors.black,
	},
	logout: {
		padding: spacing.xs,
	},
})
