import { Feather } from "@expo/vector-icons"
import { useMemo, useState } from "react"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { AppHeader } from "@/components/AppHeader"
import { Loading } from "@/components/Loading"
import { colors, fontSize, radius, spacing } from "@/constants/theme"
import { useTurnos } from "@/query/hooks/use-turnos"
import { useUserId } from "@/session/session-context"
import { formatTurnos } from "@/services/format-turnos"
import { formatValor } from "@/services/format-valor"
import { type ClientaTurno, getClientas } from "@/services/get-clientas"
import { idToFecha } from "@/services/date"

export default function ClientasScreen() {
	const insets = useSafeAreaInsets()
	const userId = useUserId()
	const { data, isLoading } = useTurnos(userId)

	const turnos = useMemo(() => formatTurnos(data), [data])
	const { clientas, nombres } = useMemo(() => getClientas(turnos), [turnos])

	return (
		<View style={[styles.container, { paddingTop: insets.top }]}>
			<AppHeader title="Clientas" />
			{isLoading ? (
				<Loading label="Cargando..." />
			) : (
				<ScrollView contentContainerStyle={styles.list}>
					{nombres.length === 0 ? (
						<Text style={styles.empty}>No hay clientas todavía</Text>
					) : (
						nombres.map(nombre => (
							<Clienta key={nombre} nombre={nombre} turnos={clientas[nombre]} />
						))
					)}
				</ScrollView>
			)}
		</View>
	)
}

function Clienta({
	nombre,
	turnos,
}: {
	nombre: string
	turnos: ClientaTurno[]
}) {
	const [open, setOpen] = useState(false)

	return (
		<View>
			<Pressable onPress={() => setOpen(prev => !prev)} style={styles.nameRow}>
				<Text style={styles.name}>
					{nombre} ({turnos.length})
				</Text>
				<Feather
					name={open ? "chevron-up" : "chevron-down"}
					size={18}
					color={colors.black}
				/>
			</Pressable>
			{open ? <ClientaTurnosList turnos={turnos} /> : null}
		</View>
	)
}

function ClientaTurnosList({ turnos }: { turnos: ClientaTurno[] }) {
	const total = turnos.reduce((acc, turno) => acc + turno.valor, 0)
	const sorted = [...turnos].sort((a, b) => a.fecha.localeCompare(b.fecha))

	return (
		<View style={styles.turnosContainer}>
			{sorted.map(turno => (
				<View
					key={turno.id}
					style={[styles.turno, turno.isDepi ? styles.depi : styles.normal]}
				>
					<Text style={styles.turnoDate}>{idToFecha(turno.fecha)}</Text>
					<Text style={styles.turnoTreatment} numberOfLines={1}>
						{turno.tratamiento}
					</Text>
					<Text style={styles.turnoValor}>{formatValor(turno.valor)}</Text>
				</View>
			))}
			<Text style={styles.total}>total : $ {formatValor(total)}</Text>
		</View>
	)
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: colors.background },
	list: { padding: spacing.md, gap: spacing.xs },
	empty: {
		textAlign: "center",
		color: colors.muted,
		marginTop: spacing.xl,
		fontSize: fontSize.md,
	},
	nameRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		backgroundColor: colors.cell,
		borderTopWidth: 1,
		borderBottomWidth: 1,
		borderColor: colors.border,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
		marginVertical: spacing.xs,
		borderRadius: radius.sm,
	},
	name: {
		fontWeight: "700",
		fontSize: fontSize.md,
		color: colors.black,
	},
	turnosContainer: { gap: 1, marginBottom: spacing.sm },
	turno: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
		paddingHorizontal: spacing.sm,
		paddingVertical: spacing.xs,
	},
	normal: { backgroundColor: colors.turno },
	depi: { backgroundColor: colors.depi },
	turnoDate: {
		width: 96,
		fontSize: fontSize.sm,
		fontWeight: "700",
		color: colors.black,
	},
	turnoTreatment: {
		flex: 1,
		fontSize: fontSize.sm,
		color: colors.black,
	},
	turnoValor: {
		fontSize: fontSize.sm,
		fontWeight: "700",
		color: colors.black,
	},
	total: {
		textAlign: "right",
		fontWeight: "700",
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.xs,
		color: colors.black,
	},
})
