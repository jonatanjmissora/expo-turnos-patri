import { LoginError, login } from "@/auth/auth.service"
import { formatFieldErrors } from "@/components/form/field-error"
import { colors, fontSize, radius, spacing } from "@/constants/theme"
import { defaultLogin, loginFormValidator } from "@/db/schema/users"
import { useSession } from "@/session/session-context"
import { useForm } from "@tanstack/react-form"
import { Link, useRouter } from "expo-router"
import { useState } from "react"
import {
	Alert,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native"

export default function LoginScreen() {
	const router = useRouter()
	const { setSession } = useSession()
	const [error, setError] = useState("")
	const [loading, setLoading] = useState(false)

	const form = useForm({
		defaultValues: defaultLogin,
		validators: { onSubmit: loginFormValidator },
		onSubmit: async ({ value }) => {
			setError("")
			setLoading(true)
			try {
				const result = await login(value.email, value.password)
				await setSession(result.user.id, result.token)
				if (result.offline) {
					Alert.alert("Sin conexión", "Ingresaste sin conexión.")
				}
				router.replace("/")
			} catch (e) {
				setError(
					e instanceof LoginError
						? e.message
						: "No se pudo ingresar. Verificá tu conexión."
				)
			} finally {
				setLoading(false)
			}
		},
	})

	return (
		<KeyboardAvoidingView
			style={styles.container}
			behavior={Platform.OS === "ios" ? "padding" : undefined}
		>
			<View style={styles.card}>
				<Text style={styles.brand}>Turnos Alba</Text>
				<Text style={styles.subtitle}>Ingresá a tu cuenta</Text>

				<form.Field name="email">
					{field => (
						<View>
							<TextInput
								selectTextOnFocus
								value={field.state.value}
								onChangeText={field.handleChange}
								onBlur={field.handleBlur}
								autoCapitalize="none"
								autoCorrect={false}
								keyboardType="email-address"
								placeholder="mail"
								placeholderTextColor={colors.mutedLight}
								style={styles.input}
							/>
							{!field.state.meta.isValid && (
								<Text style={styles.fieldError}>
									{formatFieldErrors(field.state.meta.errors)}
								</Text>
							)}
						</View>
					)}
				</form.Field>

				<form.Field name="password">
					{field => (
						<View>
							<TextInput
								value={field.state.value}
								onChangeText={field.handleChange}
								onBlur={field.handleBlur}
								secureTextEntry
								placeholder="contraseña"
								placeholderTextColor={colors.mutedLight}
								style={styles.input}
							/>
							{!field.state.meta.isValid && (
								<Text style={styles.fieldError}>
									{formatFieldErrors(field.state.meta.errors)}
								</Text>
							)}
						</View>
					)}
				</form.Field>

				{error ? <Text style={styles.error}>{error}</Text> : null}

				<Pressable
					onPress={form.handleSubmit}
					disabled={loading}
					style={[styles.button, loading && styles.buttonDisabled]}
				>
					<Text style={styles.buttonText}>
						{loading ? "Ingresando..." : "Ingresar"}
					</Text>
				</Pressable>

				<Link href="/auth/register" style={styles.link}>
					¿No tenés cuenta? Registrate
				</Link>
			</View>
		</KeyboardAvoidingView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.loginBg,
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
	fieldError: {
		color: colors.danger,
		fontSize: fontSize.xs,
		fontStyle: "italic",
		marginTop: spacing.xs,
		textAlign: "center",
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
