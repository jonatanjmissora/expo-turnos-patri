/**
 * Normaliza los errores de un campo de `@tanstack/react-form` a un string.
 * Con validadores Standard Schema (zod) los errores suelen ser issues
 * (`{ message }`); con validadores función pueden venir como string plano.
 */
export function formatFieldErrors(errors: unknown[]): string {
	return errors
		.map(err => {
			if (typeof err === "string") return err
			if (err && typeof err === "object" && "message" in err) {
				return String((err as { message?: unknown }).message ?? "")
			}
			return String(err)
		})
		.filter(Boolean)
		.join(", ")
}
