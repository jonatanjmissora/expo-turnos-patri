import { Ionicons } from "@expo/vector-icons"
import { Alert, Pressable, StyleSheet } from "react-native"
import { colors, spacing } from "@/constants/theme"
import { resetLocalData } from "@/dev/reset-local"
import { useSession } from "@/session/session-context"

/**
 * Botón SOLO para desarrollo: borra turnos + cola + banderas locales y cierra
 * sesión, para probar el flujo de login + restore desde cero. No se renderiza en
 * producción (`__DEV__`).
 */
export function DevResetButton() {
	const { signOut } = useSession()

	if (!__DEV__) return null

	const handlePress = () => {
		Alert.alert(
			"Reset local (dev)",
			"Borra los turnos, la cola de sync y las banderas locales, y cierra la sesión. Después podés loguear de nuevo y probar el restore.",
			[
				{ text: "Cancelar", style: "cancel" },
				{
					text: "Resetear",
					style: "destructive",
					onPress: async () => {
						await resetLocalData()
						await signOut()
					},
				},
			]
		)
	}

	return (
		<Pressable onPress={handlePress} hitSlop={8} style={styles.button}>
			<Ionicons name="trash-bin-outline" size={20} color={colors.danger} />
		</Pressable>
	)
}

const styles = StyleSheet.create({
	button: {
		padding: spacing.xs,
	},
})
