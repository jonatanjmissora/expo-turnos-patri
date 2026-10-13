import { Feather } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { Alert, Pressable, StyleSheet, Text, View } from "react-native"
import { colors, fontSize, radius, spacing } from "@/constants/theme"
import type { TurnoType } from "@/db/schema/turnos"
import { useDeleteTurno } from "@/query/hooks/use-turnos"
import { formatHora } from "@/services/form"
import { formatValor } from "@/services/format-valor"
import { getHeaderDay } from "@/services/header-day"

type Props = {
	fecha: string
	turnosDelDia: TurnoType[]
	onClose: () => void
}

export function TurnoList({ fecha, turnosDelDia, onClose }: Props) {
	const router = useRouter()
	const deleteTurno = useDeleteTurno()
	const { dayName, day, month } = getHeaderDay(fecha)

	const sorted = [...turnosDelDia].sort((a, b) =>
		a.hora.localeCompare(b.hora)
	)

	const handleDelete = (turno: TurnoType) => {
		Alert.alert(
			"Eliminar turno",
			`¿Eliminar el turno de ${turno.nombre} (${formatHora(turno.hora)})?`,
			[
				{ text: "Cancelar", style: "cancel" },
				{
					text: "Eliminar",
					style: "destructive",
					onPress: async () => {
						await deleteTurno.mutateAsync(turno.id)
						if (sorted.length <= 1) onClose()
					},
				},
			]
		)
	}

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<Text style={styles.headerText}>
					{dayName} {day} {month}
				</Text>
				<Pressable
					onPress={() => router.push(`/turno/nuevo?fecha=${fecha}`)}
					style={styles.addBtn}
					hitSlop={8}
				>
					<Feather name="plus" size={18} color={colors.black} />
					<Text style={styles.addText}>Agregar</Text>
				</Pressable>
			</View>

			{sorted.map(turno => (
				<View
					key={turno.id}
					style={[styles.row, turno.isDepi ? styles.rowDepi : styles.rowTurno]}
				>
					<View style={styles.rowBody}>
						<View style={styles.rowMain}>
							<Text style={styles.hora}>{formatHora(turno.hora)}</Text>
							<Text style={styles.nombre} numberOfLines={1}>
								{turno.nombre}
							</Text>
							<Text style={styles.valor}>$ {formatValor(turno.valor)}</Text>
						</View>
						<View style={styles.rowSub}>
							<Text style={styles.tratamiento} numberOfLines={1}>
								{turno.tratamiento}
							</Text>
							<Text style={styles.duracion}>{turno.duracion}m</Text>
						</View>
					</View>
					<View style={styles.icons}>
						<Pressable
							onPress={() => router.push(`/turno/${turno.id}`)}
							hitSlop={8}
							style={styles.iconBtn}
						>
							<Feather name="edit-2" size={16} color={colors.black} />
						</Pressable>
						<Pressable
							onPress={() => handleDelete(turno)}
							hitSlop={8}
							style={styles.iconBtn}
						>
							<Feather name="trash-2" size={16} color={colors.danger} />
						</Pressable>
					</View>
				</View>
			))}
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: colors.white,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: radius.md,
		margin: spacing.xs,
		padding: spacing.sm,
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: spacing.sm,
	},
	headerText: {
		fontWeight: "700",
		fontSize: fontSize.md,
		color: colors.black,
	},
	addBtn: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.xs,
		backgroundColor: colors.today,
		paddingHorizontal: spacing.sm,
		paddingVertical: spacing.xs,
		borderRadius: radius.sm,
	},
	addText: {
		fontWeight: "700",
		fontSize: fontSize.xs,
		color: colors.black,
	},
	row: {
		borderTopWidth: 1,
		borderTopColor: colors.borderSoft,
		paddingVertical: spacing.sm,
		paddingHorizontal: spacing.xs,
		flexDirection: "row",
		alignItems: "center",
	},
	rowTurno: {
		backgroundColor: colors.turno,
	},
	rowDepi: {
		backgroundColor: colors.depi,
	},
	rowBody: {
		flex: 1,
	},
	rowMain: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
	},
	hora: {
		fontWeight: "700",
		fontSize: fontSize.sm,
		color: colors.black,
		width: 46,
	},
	nombre: {
		flex: 1,
		fontWeight: "700",
		fontSize: fontSize.sm,
		color: colors.black,
	},
	valor: {
		fontWeight: "700",
		fontSize: fontSize.sm,
		color: colors.black,
	},
	rowSub: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
		marginTop: 2,
	},
	tratamiento: {
		flex: 1,
		fontSize: fontSize.xs,
		color: colors.muted,
	},
	duracion: {
		fontSize: fontSize.xs,
		color: colors.muted,
	},
	icons: {
		flexDirection: "row",
		gap: spacing.sm,
		marginLeft: spacing.sm,
	},
	iconBtn: {
		padding: 2,
	},
})
