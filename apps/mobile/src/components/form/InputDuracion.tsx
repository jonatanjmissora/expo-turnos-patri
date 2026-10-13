import { Feather } from "@expo/vector-icons"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { colors, fontSize, radius, spacing } from "@/constants/theme"

type Props = {
	value: number
	onChange: (value: number) => void
	step?: number
}

/** Stepper de duración en minutos (±15 por defecto). */
export function InputDuracion({ value, onChange, step = 15 }: Props) {
	const decrement = () => {
		if (value - step < 0) return
		onChange(value - step)
	}

	const increment = () => onChange(value + step)

	return (
		<View style={styles.container}>
			<Pressable onPress={decrement} hitSlop={10} style={styles.btn}>
				<Feather name="minus" size={18} color={colors.black} />
			</Pressable>
			<View style={styles.valueBox}>
				<Text style={styles.valueText}>{value}</Text>
				<Text style={styles.unit}>min</Text>
			</View>
			<Pressable onPress={increment} hitSlop={10} style={styles.btn}>
				<Feather name="plus" size={18} color={colors.black} />
			</Pressable>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
	},
	btn: {
		height: 40,
		width: 40,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: colors.cell,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: radius.sm,
	},
	valueBox: {
		minWidth: 70,
		alignItems: "center",
	},
	valueText: {
		fontSize: fontSize.lg,
		fontWeight: "700",
		color: colors.black,
	},
	unit: {
		fontSize: fontSize.xs,
		color: colors.muted,
	},
})
