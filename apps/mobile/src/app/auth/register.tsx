import { useForm } from "@tanstack/react-form"
import { Link, useRouter } from "expo-router"
import { useState } from "react"
import {
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native"
import { RegisterError, register } from "@/auth/auth.service"
import { defaultRegister, registerFormValidator } from "@/db/schema/users"
import { colors, fontSize, radius, spacing } from "@/constants/theme"
import { useSession } from "@/session/session-context"

export default function RegisterScreen() {
	const router = useRouter()
	const { setSession } = useSession()
	const [error, setError] = useState("")
	const [loading, setLoading] = useState(false)

	const form = useForm({
		defaultValues: defaultRegister,
		validators: { onSubmit: registerFormValidator },
		onSubmit: async ({ value }) => {
			setError("")
			setLoading(true)
			try {
				const result = await register(value.email, value.password)
				await setSession(result.user.id, result.token)
				router.replace("/")
			} catch (e) {
				setError(
					e instanceof RegisterError
						? e.message
						: "No se pudo registrar. Necesitás conexión."
				)
			} finally {
				setLoading(false)
			}
		},
	})

	return (
		<ScrollView
			style={styles.container}
			contentContainerStyle={styles.content}
			keyboardShouldPersistTaps="handled"
		>
			<View style={styles.card}>
				<Text style={styles.brand}>Turnos Alba</Text>
				<Text style={styles.subtitle}>Creá tu cuenta</Text>

				<form.Field name="email">
					{field => (
						<TextInput
							value={field.state.value}
							onChangeText={field.handleChange}
							autoCapitalize="none"
							autoCorrect={false}
							keyboardType="email-address"
							placeholder="mail"
							placeholderTextColor={colors.mutedLight}
							style={styles.input}
						/>
					)}
				</form.Field>

				<form.Field name="password">
					{field => (
						<TextInput
							value={field.state.value}
							onChangeText={field.handleChange}
							secureTextEntry
							placeholder="contraseña"
							placeholderTextColor={colors.mutedLight}
							style={styles.input}
						/>
					)}
				</form.Field>

				<form.Field name="confirmPassword">
					{field => (
						<TextInput
							value={field.state.value}
							onChangeText={field.handleChange}
							secureTextEntry
							placeholder="repetir contraseña"
							placeholderTextColor={colors.mutedLight}
							style={styles.input}
						/>
					)}
				</form.Field>

				{error ? <Text style={styles.error}>{error}</Text> : null}

				<Pressable
					onPress={form.handleSubmit}
					disabled={loading}
					style={[styles.button, loading && styles.buttonDisabled]}
				>
					<Text style={styles.buttonText}>
						{loading ? "Creando..." : "Crear cuenta"}
					</Text>
				</Pressable>

				<Link href="/auth/login" style={styles.link}>
					¿Ya tenés cuenta? Ingresá
				</Link>
			</View>
		</ScrollView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.loginBg,
	},
	content: {
		flexGrow: 1,
		justifyContent: "center",
		padding: spacing.lg,
	},
	card: {
		backgroundColor: colors.loginCard,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: radius.lg,
		padding: spacing.xl,
		gap: spacing.md,
	},
	brand: {
		fontSize: fontSize.xxl,
		fontWeight: "700",
		textAlign: "center",
		color: colors.black,
		letterSpacing: 2,
	},
	subtitle: {
		fontSize: fontSize.sm,
		textAlign: "center",
		color: colors.muted,
		marginBottom: spacing.sm,
	},
	input: {
		backgroundColor: colors.white,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: radius.sm,
		paddingVertical: spacing.sm,
		paddingHorizontal: spacing.md,
		textAlign: "center",
		fontSize: fontSize.md,
		fontWeight: "700",
		color: colors.black,
	},
	error: {
		color: colors.danger,
		textAlign: "center",
		fontWeight: "700",
	},
	button: {
		backgroundColor: colors.cell,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: radius.sm,
		paddingVertical: spacing.md,
		alignItems: "center",
		marginTop: spacing.sm,
	},
	buttonDisabled: { opacity: 0.6 },
	buttonText: {
		fontSize: fontSize.lg,
		fontWeight: "700",
		letterSpacing: 2,
		color: colors.black,
	},
	link: {
		textAlign: "center",
		color: colors.muted,
		fontSize: fontSize.sm,
		marginTop: spacing.sm,
	},
})
