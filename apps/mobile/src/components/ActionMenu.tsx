import { colors, fontSize, radius, spacing } from "@/constants/theme"
import { Ionicons } from "@expo/vector-icons"
import { type ComponentProps, type ReactNode, useState } from "react"
import {
	Modal,
	Pressable,
	StyleSheet,
	Text,
	type ViewStyle
} from "react-native"

export type ActionMenuAction = {
	label: string
	icon: ComponentProps<typeof Ionicons>["name"]
	onPress: () => void
	/** Pinta la opción en rojo (acción destructiva). */
	destructive?: boolean
}

type Props = {
	actions: ActionMenuAction[]
	children: ReactNode
	title?: string
	triggerStyle?: ViewStyle
}

/**
 * Menú de acciones (web-safe, Expo Go). Renderiza el trigger siempre y despliega
 * un modal con las opciones. Evita las vistas nativas de `@expo/ui` (que no
 * renderizan el trigger en Expo Go).
 */
export function ActionMenu({ actions, children, title, triggerStyle }: Props) {
	const [open, setOpen] = useState(false)

	const run = (action: ActionMenuAction) => {
		setOpen(false)
		action.onPress()
	}

	return (
		<>
			<Pressable
				onPress={() => setOpen(true)}
				hitSlop={8}
				style={triggerStyle}
			>
				{children}
			</Pressable>

			<Modal
				visible={open}
				transparent
				animationType="fade"
				onRequestClose={() => setOpen(false)}
			>
				<Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
					<Pressable style={styles.card} onPress={() => {}}>
						{title ? <Text style={styles.title}>{title}</Text> : null}
						{actions.map(action => (
							<Pressable
								key={action.label}
								style={styles.item}
								onPress={() => run(action)}
							>
								<Text
									style={[
										styles.itemText,
										action.destructive && styles.destructive,
									]}
								>
									{action.label}
								</Text>
								<Ionicons name={action.icon} size={20} color={action.destructive ? colors.danger : colors.black} />
							</Pressable>
						))}
						<Pressable
							style={[styles.item, styles.cancel]}
							onPress={() => setOpen(false)}
						>
							<Text style={styles.cancelText}>Cancelar</Text>
						</Pressable>
					</Pressable>
				</Pressable>
			</Modal>
		</>
	)
}

const styles = StyleSheet.create({
	backdrop: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.4)",
		justifyContent: "center",
		padding: spacing.xl,
	},
	card: {
		backgroundColor: colors.white,
		borderRadius: radius.lg,
		overflow: "hidden",
	},
	title: {
		textAlign: "center",
		color: colors.muted,
		fontSize: fontSize.sm,
		paddingHorizontal: spacing.lg,
		paddingTop: spacing.md,
		paddingBottom: spacing.sm,
	},
	item: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		gap: spacing.lg,
		paddingVertical: spacing.md,
		paddingHorizontal: spacing.lg,
		borderTopWidth: 1,
		borderTopColor: colors.border,
	},
	itemText: {
		textAlign: "center",
		fontSize: fontSize.md,
		fontWeight: "700",
		color: colors.black,
	},
	destructive: {
		color: colors.danger,
	},
	cancel: {
		backgroundColor: colors.cell,
	},
	cancelText: {
		textAlign: "center",
		fontSize: fontSize.md,
		color: colors.muted,
	},
})
