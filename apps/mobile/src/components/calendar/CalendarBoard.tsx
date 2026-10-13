import { useState } from "react"
import { StyleSheet, Text, View } from "react-native"
import { colors, fontSize, spacing } from "@/constants/theme"
import type { TurnosByDate } from "@/services/format-turnos"
import { CalendarWeek } from "./CalendarWeek"

const DAY_HEADERS = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab"] as const

type Props = {
	weeks: string[][]
	turnos: TurnosByDate
	/** 2 dígitos, ej. "05" */
	actualMonth: string
	actualDate: string
}

export function CalendarBoard({ weeks, turnos, actualMonth, actualDate }: Props) {
	const [expandedDate, setExpandedDate] = useState<string | null>(null)

	const handleToggle = (date: string) => {
		setExpandedDate(prev => (prev === date ? null : date))
	}

	return (
		<View style={styles.board}>
			<View style={styles.weekHeader}>
				{DAY_HEADERS.map(day => (
					<Text key={day} style={styles.dayStr}>
						{day}
					</Text>
				))}
			</View>
			{weeks.map((week, index) => (
				<CalendarWeek
					key={index}
					week={week}
					turnos={turnos}
					actualMonth={actualMonth}
					actualDate={actualDate}
					expandedDate={expandedDate}
					onToggle={handleToggle}
				/>
			))}
		</View>
	)
}

const styles = StyleSheet.create({
	board: {
		borderTopWidth: 1,
		borderTopColor: colors.border,
		paddingVertical: spacing.xs,
	},
	weekHeader: {
		flexDirection: "row",
		paddingVertical: spacing.md,
	},
	dayStr: {
		flex: 1,
		textAlign: "center",
		fontWeight: "700",
		fontSize: fontSize.sm,
		color: colors.black,
	},
})
