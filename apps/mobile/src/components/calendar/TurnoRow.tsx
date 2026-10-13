import { ActionMenu } from "@/components/ActionMenu"
import { colors, fontSize, radius, spacing } from "@/constants/theme"
import type { TurnoType } from "@/db/schema/turnos"
import { useDeleteTurno } from "@/query/hooks/use-turnos"
import { formatHora } from "@/services/form"
import { formatValor } from "@/services/format-valor"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { Alert, StyleSheet, Text, View } from "react-native"

type Props = {
	turno: TurnoType
	onDeleted?: () => void
}

/** Fila de un turno (full width), con menú de acciones (editar / eliminar). */
export function TurnoRow({ turno, onDeleted }: Props) {
	const router = useRouter()
	const deleteTurno = useDeleteTurno()

	const handleEdit = () => {
		router.push({ pathname: "/turno/[id]", params: { id: turno.id } })
	}

	const handleDelete = () => {
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
						onDeleted?.()
					},
				},
			]
		)
	}

	return (
		<View
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

			<ActionMenu
				title={`${formatHora(turno.hora)} · ${turno.nombre}`}
				triggerStyle={styles.menuTrigger}
				actions={[
					{ label: "Editar", icon: "pencil", onPress: handleEdit },
					{ label: "Eliminar",destructive: true, icon: "trash-outline", onPress: handleDelete },
				]}
			>
				<Ionicons name="settings-outline" size={20} color={colors.black} />
			</ActionMenu>
		</View>
	)
}

const styles = StyleSheet.create({
	row: {
		width: "100%",
		borderWidth: 1,
		borderColor: colors.borderSoft,
		borderRadius: radius.md,
		paddingVertical: spacing.sm,
		paddingHorizontal: spacing.md,
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
		fontSize: fontSize.md,
		color: colors.black,
		width: 56,
	},
	nombre: {
		flex: 1,
		fontWeight: "700",
		fontSize: fontSize.md,
		color: colors.black,
	},
	valor: {
		fontWeight: "700",
		fontSize: fontSize.md,
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
		fontSize: fontSize.sm,
		color: colors.muted,
	},
	duracion: {
		fontSize: fontSize.sm,
		color: colors.muted,
	},
	menuTrigger: {
		marginLeft: spacing.md,
		padding: spacing.xs,
	},
})
