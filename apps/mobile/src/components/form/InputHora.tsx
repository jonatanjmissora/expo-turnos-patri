import { StyleSheet, TextInput, type TextInputProps } from "react-native"
import { colors, fontSize, radius, spacing } from "@/constants/theme"

type Props = {
	value: string
	onChange: (value: string) => void
	onBlur?: () => void
} & Pick<TextInputProps, "editable" | "placeholder">

/** Input numérico de 4 dígitos para la hora (`HHMM`). */
export function InputHora({
	value,
	onChange,
	onBlur,
	editable,
	placeholder,
}: Props) {
	return (
		<TextInput
			value={value}
			onChangeText={text => onChange(text.replace(/\D/g, "").slice(0, 4))}
			onBlur={onBlur}
			keyboardType="number-pad"
			maxLength={4}
			editable={editable}
			placeholder={placeholder ?? "hora"}
			placeholderTextColor={colors.mutedLight}
			style={styles.input}
		/>
	)
}

const styles = StyleSheet.create({
	input: {
		flex: 1,
		backgroundColor: colors.cell,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: radius.sm,
		paddingVertical: spacing.sm,
		paddingHorizontal: spacing.md,
		textAlign: "center",
		fontSize: fontSize.lg,
		fontWeight: "700",
		color: colors.black,
	},
})
