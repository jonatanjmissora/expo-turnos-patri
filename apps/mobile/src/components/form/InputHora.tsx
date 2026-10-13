import { Feather } from "@expo/vector-icons"
import DateTimePicker from "@react-native-community/datetimepicker"
import { useState } from "react"
import {
	Modal,
	Platform,
	Pressable,
	StyleSheet,
	Text,
	View,
} from "react-native"
import { colors, fontSize, radius, spacing } from "@/constants/theme"

type Props = {
	/** Hora en formato `HHMM`, o "" si no se eligió. */
	value: string
	onChange: (value: string) => void
}

const MINUTE_STEP = 15

function horaToDate(hora: string): Date {
	const date = new Date()
	if (/^\d{4}$/.test(hora)) {
		date.setHours(Number(hora.slice(0, 2)), Number(hora.slice(2, 4)), 0, 0)
	} else {
		date.setHours(9, 0, 0, 0)
	}
	return date
}

function dateToHora(date: Date): string {
	const hours = String(date.getHours()).padStart(2, "0")
	const minutes = String(date.getMinutes()).padStart(2, "0")
	return `${hours}${minutes}`
}

/** Selector de hora (sin segundos), en saltos de 15 minutos. */
export function InputHora({ value, onChange }: Props) {
	const [show, setShow] = useState(false)
	const [temp, setTemp] = useState(() => horaToDate(value))

	const open = () => {
		setTemp(horaToDate(value))
		setShow(true)
	}

	const display = value
		? `${value.slice(0, 2)}:${value.slice(2, 4)}`
		: "Elegir hora"

	return (
		<>
			<Pressable onPress={open} style={styles.field}>
				<Text style={[styles.value, !value && styles.placeholder]}>
					{display}
				</Text>
				<Feather name="clock" size={18} color={colors.muted} />
			</Pressable>

			{show && Platform.OS === "android" ? (
				<DateTimePicker
					value={temp}
					mode="time"
					display="default"
					is24Hour
					minuteInterval={MINUTE_STEP}
					onValueChange={(_event, date) => {
						setShow(false)
						onChange(dateToHora(date))
					}}
					onDismiss={() => setShow(false)}
				/>
			) : null}

			{Platform.OS === "ios" ? (
				<Modal
					visible={show}
					transparent
					animationType="fade"
					onRequestClose={() => setShow(false)}
				>
					<Pressable style={styles.backdrop} onPress={() => setShow(false)}>
						<Pressable style={styles.sheet} onPress={() => {}}>
							<Text style={styles.sheetTitle}>Elegir hora</Text>
							<DateTimePicker
								value={temp}
								mode="time"
								display="spinner"
								minuteInterval={MINUTE_STEP}
								onValueChange={(_event, date) => setTemp(date)}
								style={styles.picker}
							/>
							<View style={styles.actions}>
								<Pressable
									onPress={() => setShow(false)}
									style={styles.btnGhost}
								>
									<Text style={styles.btnGhostText}>Cancelar</Text>
								</Pressable>
								<Pressable
									onPress={() => {
										onChange(dateToHora(temp))
										setShow(false)
									}}
									style={styles.btnPrimary}
								>
									<Text style={styles.btnPrimaryText}>Listo</Text>
								</Pressable>
							</View>
						</Pressable>
					</Pressable>
				</Modal>
			) : null}
		</>
	)
}

const styles = StyleSheet.create({
	field: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: spacing.sm,
		backgroundColor: colors.cell,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: radius.sm,
		paddingVertical: spacing.sm,
		paddingHorizontal: spacing.md,
	},
	value: {
		fontSize: fontSize.lg,
		fontWeight: "700",
		color: colors.black,
	},
	placeholder: {
		color: colors.mutedLight,
		fontWeight: "400",
		fontSize: fontSize.md,
	},
	backdrop: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.4)",
		justifyContent: "center",
		padding: spacing.lg,
	},
	sheet: {
		backgroundColor: colors.white,
		borderRadius: radius.lg,
		padding: spacing.lg,
	},
	sheetTitle: {
		fontSize: fontSize.md,
		fontWeight: "700",
		textAlign: "center",
		color: colors.black,
		marginBottom: spacing.sm,
	},
	picker: {
		alignSelf: "center",
	},
	actions: {
		flexDirection: "row",
		justifyContent: "flex-end",
		gap: spacing.sm,
		marginTop: spacing.sm,
	},
	btnGhost: {
		paddingVertical: spacing.sm,
		paddingHorizontal: spacing.lg,
		borderRadius: radius.sm,
	},
	btnGhostText: {
		fontSize: fontSize.md,
		color: colors.muted,
	},
	btnPrimary: {
		backgroundColor: colors.today,
		borderWidth: 1,
		borderColor: colors.border,
		paddingVertical: spacing.sm,
		paddingHorizontal: spacing.xl,
		borderRadius: radius.sm,
	},
	btnPrimaryText: {
		fontSize: fontSize.md,
		fontWeight: "700",
		color: colors.black,
	},
})
