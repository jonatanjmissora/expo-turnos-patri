import { Feather } from "@expo/vector-icons"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { DevResetButton } from "@/components/dev/DevResetButton"
import { colors, fontSize, radius, spacing } from "@/constants/theme"
import { useSyncStatus } from "@/query/hooks/use-sync-status"
import { useSession } from "@/session/session-context"

type Props = {
	title: string
}

export function AppHeader({ title }: Props) {
	const { signOut } = useSession()
	const { pendingCount } = useSyncStatus()

	return (
		<View style={styles.header}>
			<View style={styles.left}>
				<Text style={styles.title}>{title}</Text>
				{pendingCount > 0 ? (
					<View style={styles.badge}>
						<Text style={styles.badgeText}>{pendingCount}</Text>
					</View>
				) : null}
			</View>
			<View style={styles.actions}>
				<DevResetButton />
				<Pressable onPress={signOut} hitSlop={10} style={styles.logout}>
					<Feather name="log-out" size={22} color={colors.black} />
				</Pressable>
			</View>
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
	left: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
	},
	actions: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.md,
	},
	title: {
		fontSize: fontSize.lg,
		fontWeight: "700",
		letterSpacing: 2,
		color: colors.black,
	},
	badge: {
		minWidth: 22,
		paddingHorizontal: spacing.xs,
		paddingVertical: 2,
		borderRadius: radius.pill,
		backgroundColor: colors.danger,
		alignItems: "center",
		justifyContent: "center",
	},
	badgeText: {
		color: colors.white,
		fontSize: fontSize.xs,
		fontWeight: "700",
	},
	logout: {
		padding: spacing.xs,
	},
})
