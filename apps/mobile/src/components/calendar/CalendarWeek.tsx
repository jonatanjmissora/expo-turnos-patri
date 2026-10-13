import { StyleSheet, Text, View } from "react-native"
import { colors, fontSize, spacing } from "@/constants/theme"
import type { TurnoType } from "@/db/schema/turnos"
import type { TurnosByDate } from "@/services/format-turnos"
import { formatValor } from "@/services/format-valor"
import { DateCell } from "./DateCell"

type Props = {
	week: string[]
	turnos: TurnosByDate
	actualMonth: string
	actualDate: string
}

export function CalendarWeek({ week, turnos, actualMonth, actualDate }: Props) {
	const totalWeek = week.reduce((acc, fecha) => {
		const totalDia = (turnos[fecha] ?? []).reduce(
			(sum: number, turno: TurnoType) => sum + turno.valor,
			0
		)
		return acc + totalDia
	}, 0)

	return (
		<View>
			<View style={styles.week}>
				{week.map(fecha => (
					<DateCell
						key={fecha}
						fecha={fecha}
						inMonth={fecha.split("-")[1] === actualMonth}
						isToday={fecha === actualDate}
						turnosDelDia={turnos[fecha] ?? []}
					/>
				))}
			</View>

			<Text style={styles.totalWeek}>Total $ {formatValor(totalWeek)}</Text>
		</View>
	)
}

const styles = StyleSheet.create({
	week: {
		flexDirection: "row",
	},
	totalWeek: {
		textAlign: "right",
		marginVertical: spacing.xs,
		marginRight: spacing.sm,
		fontWeight: "700",
		fontSize: fontSize.sm,
		color: colors.black,
	},
})
