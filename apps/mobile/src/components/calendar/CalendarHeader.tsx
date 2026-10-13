import { Feather } from "@expo/vector-icons"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { colors, fontSize, radius, spacing } from "@/constants/theme"
import { MONTH_NAMES } from "@/services/calendar"

type Props = {
	year: number
	/** 1-12 */
	month: number
	onChange: (year: number, month: number) => void
}

export function CalendarHeader({ year, month, onChange }: Props) {
	const handlePrev = () => {
		if (month === 1) onChange(year - 1, 12)
		else onChange(year, month - 1)
	}

	const handleNext = () => {
		if (month === 12) onChange(year + 1, 1)
		else onChange(year, month + 1)
	}

	return (
		<View style={styles.header}>
			<Pressable onPress={handlePrev} hitSlop={10} style={styles.iconBtn}>
				<Feather name="chevron-left" size={28} color={colors.black} />
			</Pressable>
			<View style={styles.titleContainer}>
				<Text style={styles.month}>{MONTH_NAMES[month - 1]}</Text>
				<Text style={styles.year}>{year}</Text>
			</View>
			<Pressable onPress={handleNext} hitSlop={10} style={styles.iconBtn}>
				<Feather name="chevron-right" size={28} color={colors.black} />
			</Pressable>
		</View>
	)
}

const styles = StyleSheet.create({
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginHorizontal: spacing.md,
	},
	iconBtn: {
		height: 40,
		width: 40,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: radius.pill,
	},
	titleContainer: {
		flex: 1,
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "baseline",
		gap: spacing.sm,
	},
	month: {
		fontSize: fontSize.lg,
		fontWeight: "700",
		letterSpacing: 2,
		color: colors.black,
	},
	year: {
		fontSize: fontSize.lg,
		fontWeight: "700",
		color: colors.muted,
	},
})
