import { colors, fontSize, radius, spacing } from "@/constants/theme"
import {
	DEPILACION_OPTIONS,
	TRATAMIENTO_OPTIONS,
	type TratamientoOption,
} from "@/constants/tratamientos"
import {
	defaultTurno,
	turnoFormValidator,
	type TurnoFormType,
	type TurnoType,
} from "@/db/schema/turnos"
import {
	useCreateTurno,
	useTurnos,
	useUpdateTurno,
} from "@/query/hooks/use-turnos"
import { dateToFecha, fechaToDate } from "@/services/date"
import {
	buildTratamiento,
	checkHoraFormat,
	checkTurnoInConflict,
	isTratamientoDepi,
} from "@/services/form"
import { formatTurnos } from "@/services/format-turnos"
import { getHeaderDay } from "@/services/header-day"
import { useUserId } from "@/session/session-context"
import DateTimePicker from "@react-native-community/datetimepicker"
import { useForm } from "@tanstack/react-form"
import { useState } from "react"
import {
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native"
import { ChipMultiSelect, ChipSelect } from "./ChipGroup"
import { formatFieldErrors } from "./field-error"
import { InputDuracion } from "./InputDuracion"
import { InputHora } from "./InputHora"

type Props = {
	mode: "create" | "edit"
	turnoId?: string
	initial: TurnoFormType
	onSaved: () => void
	onCancel: () => void
}

/** Construye los valores del formulario a partir de un turno existente. */
export function turnoToFormValues(turno: TurnoType): TurnoFormType {
	const isDepi = turno.isDepi || isTratamientoDepi(turno.tratamiento)
	if (isDepi) {
		return {
			...defaultTurno(turno.fecha),
			hora: turno.hora,
			duracion: turno.duracion,
			nombre: turno.nombre,
			tratamiento: "depilacion",
			depilacion: turno.tratamiento.split("/").map(part => part.trim()),
			valor: String(turno.valor),
		}
	}

	const isKnown = (TRATAMIENTO_OPTIONS as readonly string[]).includes(
		turno.tratamiento
	)
	return {
		...defaultTurno(turno.fecha),
		hora: turno.hora,
		duracion: turno.duracion,
		nombre: turno.nombre,
		tratamiento: isKnown
			? (turno.tratamiento as TratamientoOption)
			: "otro",
		otro: isKnown ? "" : turno.tratamiento,
		valor: String(turno.valor),
	}
}

export function TurnoForm({
	mode,
	turnoId,
	initial,
	onSaved,
	onCancel,
}: Props) {
	const userId = useUserId()
	const { data: turnosData } = useTurnos(userId)
	const turnos = formatTurnos(turnosData)
	const createTurno = useCreateTurno()
	const updateTurno = useUpdateTurno()

	const [error, setError] = useState("")
	const [saving, setSaving] = useState(false)
	const [showDate, setShowDate] = useState(false)

	const form = useForm({
		defaultValues: initial,
		validators: { onSubmit: turnoFormValidator },
		onSubmit: async ({ value }) => {
			if (!userId) {
				setError("Sesión no válida")
				return
			}

			const hora = checkHoraFormat(value.hora)
			if (!hora) {
				setError("Hora incorrecta (formato HHMM)")
				return
			}

			const built = buildTratamiento(
				value.tratamiento,
				value.otro,
				value.depilacion
			)
			if (!built.tratamiento) {
				setError("Seleccione un tratamiento")
				return
			}

			const duracion = Math.max(0, Math.trunc(value.duracion))
			const turnosDelDia = turnos[value.fecha] ?? []
			const { conflict, message } = checkTurnoInConflict(
				hora,
				duracion,
				turnosDelDia,
				mode === "edit" ? turnoId : undefined
			)
			if (conflict) {
				setError(message)
				return
			}

			const valor = Number.parseInt(value.valor || "0", 10)
			if (Number.isNaN(valor)) {
				setError("Valor inválido")
				return
			}

			setError("")
			setSaving(true)
			try {
				const payload = {
					userId,
					fecha: value.fecha,
					hora,
					duracion,
					nombre: value.nombre.trim(),
					tratamiento: built.tratamiento,
					isDepi: built.isDepi,
					valor,
				}

				if (mode === "edit" && turnoId) {
					await updateTurno.mutateAsync({ id: turnoId, input: payload })
				} else {
					await createTurno.mutateAsync(payload)
				}
				onSaved()
			} catch (e) {
				setError(e instanceof Error ? e.message : "No se pudo guardar")
			} finally {
				setSaving(false)
			}
		},
	})

	const header = getHeaderDay(initial.fecha)

	return (
		<KeyboardAvoidingView
			style={styles.flex}
			behavior={Platform.OS === "ios" ? "padding" : undefined}
		>
			<ScrollView
				contentContainerStyle={styles.content}
				keyboardShouldPersistTaps="handled"
			>
				{/* Fecha */}
				<View style={styles.titleRow}>
					{mode === "edit" ? (
						<Pressable onPress={() => setShowDate(true)} style={styles.dateBtn}>
							<Text style={styles.dateBtnText}>
								{header.dayName} {header.day} {header.month}
							</Text>
						</Pressable>
					) : (
						<Text style={styles.title}>
							{header.dayName} {header.day} {header.month}
						</Text>
					)}
				</View>

				{mode === "edit" && showDate ? (
					<DateTimePicker
						value={fechaToDate(form.state.values.fecha)}
						mode="date"
						display={Platform.OS === "ios" ? "inline" : "default"}
						onValueChange={(_event, date) => {
							if (Platform.OS === "android") setShowDate(false)
							form.setFieldValue("fecha", dateToFecha(date))
						}}
						onDismiss={() => setShowDate(false)}
					/>
				) : null}

				{/* Hora y Nombre */}
				<View style={styles.row}>
					<View style={styles.col}>
						<Text style={styles.label}>Hora</Text>
						<form.Field name="hora">
							{field => (
								<View>
									<InputHora
										value={field.state.value}
										onChange={field.handleChange}
									/>
									{!field.state.meta.isValid && (
										<Text style={styles.fieldError}>
											{formatFieldErrors(field.state.meta.errors)}
										</Text>
									)}
								</View>
							)}
						</form.Field>
					</View>
					<View style={styles.col}>
						<Text style={styles.label}>Nombre</Text>
						<form.Field name="nombre">
							{field => (
								<View>
									<TextInput
										value={field.state.value}
										onChangeText={field.handleChange}
										onBlur={field.handleBlur}
										placeholder="nombre"
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
					</View>
				</View>

				{/* Tratamiento */}
				<View>
					<Text style={styles.label}>Tratamiento</Text>
					<form.Field name="tratamiento">
						{field => (
							<View>
								<ChipSelect
									options={TRATAMIENTO_OPTIONS}
									value={field.state.value}
									onChange={value =>
										field.handleChange(value as TratamientoOption)
									}
								/>
								{!field.state.meta.isValid && (
									<Text style={styles.fieldError}>
										{formatFieldErrors(field.state.meta.errors)}
									</Text>
								)}
							</View>
						)}
					</form.Field>
				</View>

				{/* Depilación (multi) */}
				<form.Subscribe selector={state => state.values.tratamiento}>
					{tratamiento =>
						tratamiento === "depilacion" ? (
							<View>
								<Text style={styles.label}>Zonas de depilación</Text>
								<form.Field name="depilacion">
									{field => (
										<View>
											<ChipMultiSelect
												options={DEPILACION_OPTIONS}
												values={field.state.value}
												onToggle={option => {
													const current = field.state.value
													field.handleChange(
														current.includes(option)
															? current.filter(item => item !== option)
															: [...current, option]
													)
												}}
											/>
											{!field.state.meta.isValid && (
												<Text style={styles.fieldError}>
													{formatFieldErrors(field.state.meta.errors)}
												</Text>
											)}
										</View>
									)}
								</form.Field>
							</View>
						) : tratamiento === "otro" ? (
							<View>
								<Text style={styles.label}>Otro tratamiento</Text>
								<form.Field name="otro">
									{field => (
										<View>
											<TextInput
												value={field.state.value}
												onChangeText={field.handleChange}
												onBlur={field.handleBlur}
												placeholder="detalle"
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
							</View>
						) : null
					}
				</form.Subscribe>

				{/* Duración y Valor */}
				<View style={styles.row}>
					<View style={styles.col}>
						<Text style={styles.label}>Duración</Text>
						<form.Field name="duracion">
							{field => (
								<View>
									<InputDuracion
										value={field.state.value}
										onChange={field.handleChange}
									/>
									{!field.state.meta.isValid && (
										<Text style={styles.fieldError}>
											{formatFieldErrors(field.state.meta.errors)}
										</Text>
									)}
								</View>
							)}
						</form.Field>
					</View>
					<View style={styles.col}>
						<Text style={styles.label}>Valor</Text>
						<form.Field name="valor">
							{field => (
								<View>
									<TextInput
										value={field.state.value}
										onChangeText={text =>
											field.handleChange(text.replace(/\D/g, ""))
										}
										onBlur={field.handleBlur}
										keyboardType="number-pad"
										placeholder="valor"
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
					</View>
				</View>

				{error ? <Text style={styles.error}>{error}</Text> : null}

				<Pressable
					onPress={form.handleSubmit}
					disabled={saving}
					style={[styles.submit, saving && styles.submitDisabled]}
				>
					<Text style={styles.submitText}>
						{saving ? "Guardando..." : mode === "edit" ? "Modificar" : "Agregar"}
					</Text>
				</Pressable>

				<Pressable onPress={onCancel} style={styles.cancel}>
					<Text style={styles.cancelText}>Cancelar</Text>
				</Pressable>
			</ScrollView>
		</KeyboardAvoidingView>
	)
}

const styles = StyleSheet.create({
	flex: { flex: 1, backgroundColor: colors.background },
	content: {
		padding: spacing.lg,
		gap: spacing.xxl,
	},
	titleRow: {
		alignItems: "center",
	},
	title: {
		fontSize: fontSize.xl,
		fontWeight: "700",
		color: colors.black,
	},
	dateBtn: {
		backgroundColor: colors.cell,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: radius.sm,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
	},
	dateBtnText: {
		fontSize: fontSize.lg,
		fontWeight: "700",
		color: colors.black,
	},
	row: {
		flexDirection: "row",
		gap: spacing.md,
	},
	col: {
		flex: 1,
		gap: spacing.xs,
	},
	label: {
		fontSize: fontSize.sm,
		color: colors.muted,
		marginBottom: spacing.xs,
	},
	input: {
		backgroundColor: colors.cell,
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
		fontSize: fontSize.md,
		fontWeight: "700",
		textAlign: "center",
	},
	submit: {
		backgroundColor: colors.today,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: radius.sm,
		paddingVertical: spacing.md,
		alignItems: "center",
	},
	submitDisabled: {
		opacity: 0.6,
	},
	submitText: {
		fontSize: fontSize.lg,
		fontWeight: "700",
		letterSpacing: 2,
		color: colors.black,
	},
	cancel: {
		alignItems: "center",
		paddingVertical: spacing.sm,
	},
	cancelText: {
		fontSize: fontSize.md,
		color: colors.muted,
	},
})
