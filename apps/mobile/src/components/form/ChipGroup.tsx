import { Pressable, StyleSheet, Text, View } from "react-native"
import { colors, fontSize, radius, spacing } from "@/constants/theme"

type SingleProps = {
	options: readonly string[]
	value: string
	onChange: (value: string) => void
}

export function ChipSelect({ options, value, onChange }: SingleProps) {
	return (
		<View style={styles.group}>
			{options.map(option => {
				const active = option === value
				return (
					<Pressable
						key={option}
						onPress={() => onChange(option)}
						style={[styles.chip, active && styles.chipActive]}
					>
						<Text style={[styles.chipText, active && styles.chipTextActive]}>
							{option}
						</Text>
					</Pressable>
				)
			})}
		</View>
	)
}

type MultiProps = {
	options: readonly string[]
	values: string[]
	onToggle: (value: string) => void
}

export function ChipMultiSelect({ options, values, onToggle }: MultiProps) {
	return (
		<View style={styles.group}>
			{options.map(option => {
				const active = values.includes(option)
				return (
					<Pressable
						key={option}
						onPress={() => onToggle(option)}
						style={[styles.chip, active && styles.chipActive]}
					>
						<Text style={[styles.chipText, active && styles.chipTextActive]}>
							{option}
						</Text>
					</Pressable>
				)
			})}
		</View>
	)
}

const styles = StyleSheet.create({
	group: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "center",
		gap: spacing.sm,
	},
	chip: {
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: radius.md,
		paddingHorizontal: spacing.sm,
		paddingVertical: spacing.xs,
		backgroundColor: colors.white,
	},
	chipActive: {
		backgroundColor: colors.today,
		borderColor: colors.muted,
	},
	chipText: {
		fontSize: fontSize.sm,
		color: colors.muted,
	},
	chipTextActive: {
		color: colors.black,
		fontWeight: "700",
	},
})
