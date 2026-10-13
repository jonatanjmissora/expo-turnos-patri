import { useMemo, useState } from "react"
import { StyleSheet, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { AppHeader } from "@/components/AppHeader"
import { Loading } from "@/components/Loading"
import { CalendarBoard } from "@/components/calendar/CalendarBoard"
import { CalendarHeader } from "@/components/calendar/CalendarHeader"
import { colors } from "@/constants/theme"
import { useTurnos } from "@/query/hooks/use-turnos"
import { useUserId } from "@/session/session-context"
import { getMonthWeeks } from "@/services/calendar"
import { getActualDate } from "@/services/date"
import { formatTurnos } from "@/services/format-turnos"

export default function CalendarScreen() {
	const insets = useSafeAreaInsets()
	const userId = useUserId()
	const { data, isLoading } = useTurnos(userId)

	const actualDate = getActualDate()
	const [year, setYear] = useState(Number(actualDate.slice(0, 4)))
	const [month, setMonth] = useState(Number(actualDate.slice(5, 7)))

	const turnos = useMemo(() => formatTurnos(data), [data])
	const weeks = useMemo(() => getMonthWeeks(year, month), [year, month])
	const actualMonth = String(month).padStart(2, "0")

	const handleChange = (nextYear: number, nextMonth: number) => {
		setYear(nextYear)
		setMonth(nextMonth)
	}

	return (
		<View style={[styles.container, { paddingTop: insets.top }]}>
			<AppHeader title="Turnos" />
			<CalendarHeader year={year} month={month} onChange={handleChange} />
			{isLoading ? (
				<Loading label="Cargando..." />
			) : (
				<CalendarBoard
					weeks={weeks}
					turnos={turnos}
					actualMonth={actualMonth}
					actualDate={actualDate}
				/>
			)}
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.background,
	},
})
