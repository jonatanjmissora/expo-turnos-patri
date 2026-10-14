import { useMemo, useState } from "react"
import { StyleSheet, useWindowDimensions, View } from "react-native"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import Animated, {
	Easing,
	type SharedValue,
	runOnJS,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming,
} from "react-native-reanimated"
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
import type { TurnosByDate } from "@/services/format-turnos"

const SNAP_MS = 220

const indexFrom = (year: number, month: number) => year * 12 + (month - 1)
const yearFromIndex = (index: number) => Math.floor(index / 12)
const monthFromIndex = (index: number) => (index % 12) + 1

type PageProps = {
	index: number
	width: number
	windowStart: SharedValue<number>
	scrollOffset: SharedValue<number>
	turnos: TurnosByDate
	actualDate: string
}

/** Una página del carrusel. Su posición la calcula 100% el hilo de UI. */
function CalendarPage({
	index,
	width,
	windowStart,
	scrollOffset,
	turnos,
	actualDate,
}: PageProps) {
	const weeks = useMemo(
		() => getMonthWeeks(yearFromIndex(index), monthFromIndex(index)),
		[index]
	)

	const style = useAnimatedStyle(() => ({
		transform: [
			{
				translateX: (index - windowStart.value) * width + scrollOffset.value,
			},
		],
	}))

	return (
		<Animated.View style={[styles.page, { width }, style]}>
			<CalendarBoard
				weeks={weeks}
				turnos={turnos}
				actualMonth={String(monthFromIndex(index)).padStart(2, "0")}
				actualDate={actualDate}
			/>
		</Animated.View>
	)
}

export default function CalendarScreen() {
	const insets = useSafeAreaInsets()
	const { width } = useWindowDimensions()
	const userId = useUserId()
	const { data, isLoading } = useTurnos(userId)

	const actualDate = getActualDate()
	const initialIndex = indexFrom(
		Number(actualDate.slice(0, 4)),
		Number(actualDate.slice(5, 7))
	)

	const [centerIndex, setCenterIndex] = useState(initialIndex)
	const year = yearFromIndex(centerIndex)
	const month = monthFromIndex(centerIndex)

	const turnos = useMemo(() => formatTurnos(data), [data])

	// Ventana de 3 meses. El índice del slot 0 es `centerIndex - 1`.
	const months = useMemo(
		() => [centerIndex - 1, centerIndex, centerIndex + 1],
		[centerIndex]
	)

	// Posición del carrusel: solo shared values (hilo de UI). El contenido se
	// reordena por índice absoluto, así la página central no cambia al rebasar.
	const windowStart = useSharedValue(initialIndex - 1)
	const scrollOffset = useSharedValue(-width)
	const startOffset = useSharedValue(-width)

	const pan = useMemo(
		() =>
			Gesture.Pan()
				.activeOffsetX([-15, 15])
				.failOffsetY([-15, 15])
				.onBegin(() => {
					startOffset.value = scrollOffset.value
				})
				.onUpdate(event => {
					scrollOffset.value = Math.min(
						0,
						Math.max(-2 * width, startOffset.value + event.translationX)
					)
				})
				.onEnd(event => {
					const threshold = width * 0.25
					let direction = 0
					if (
						event.translationX <= -threshold ||
						event.velocityX <= -600
					) {
						direction = 1
					} else if (
						event.translationX >= threshold ||
						event.velocityX >= 600
					) {
						direction = -1
					}

					if (direction === 0) {
						scrollOffset.value = withSpring(-width, {
							damping: 20,
							stiffness: 200,
						})
						return
					}

					scrollOffset.value = withTiming(
						direction > 0 ? -2 * width : 0,
						{ duration: SNAP_MS, easing: Easing.out(Easing.ease) },
						finished => {
							if (!finished) return
							// Rebase atómico en el hilo de UI + cambio de contenido.
							windowStart.value = windowStart.value + direction
							scrollOffset.value = -width
							runOnJS(setCenterIndex)(centerIndex + direction)
						}
					)
				}),
		[centerIndex, width, scrollOffset, startOffset, windowStart]
	)

	// Los chevrones hacen el mismo snap (un paso) animado.
	const handleChange = (nextYear: number, nextMonth: number) => {
		const target = indexFrom(nextYear, nextMonth)
		const direction = Math.sign(target - centerIndex)
		if (direction === 0) return
		scrollOffset.value = withTiming(
			direction > 0 ? -2 * width : 0,
			{ duration: SNAP_MS, easing: Easing.out(Easing.ease) },
			finished => {
				if (!finished) return
				windowStart.value = target - 1
				scrollOffset.value = -width
				runOnJS(setCenterIndex)(target)
			}
		)
	}

	return (
		<View style={[styles.container, { paddingTop: insets.top }]}>
			<AppHeader title="Turnos" />
			<CalendarHeader year={year} month={month} onChange={handleChange} />
			{isLoading ? (
				<Loading label="Cargando..." />
			) : (
				<View style={styles.viewport}>
					<GestureDetector gesture={pan}>
						<View style={StyleSheet.absoluteFill}>
							{months.map(index => (
								<CalendarPage
									key={index}
									index={index}
									width={width}
									windowStart={windowStart}
									scrollOffset={scrollOffset}
									turnos={turnos}
									actualDate={actualDate}
								/>
							))}
						</View>
					</GestureDetector>
				</View>
			)}
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.background,
	},
	viewport: {
		flex: 1,
		overflow: "hidden",
	},
	page: {
		position: "absolute",
		top: 0,
		left: 0,
	},
})
