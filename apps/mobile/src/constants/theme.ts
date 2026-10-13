/**
 * Tema de la app (paleta portada del CSS de `react-turnos-patri`).
 * Las variables CSS del repo web se mapean 1:1 a `colors`.
 */
export const colors = {
	/** --body-bg */
	background: "#FEF2FF",
	/** --cell */
	cell: "#F3E2FF",
	/** --turno */
	turno: "rgba(241, 166, 174, 0.63)",
	/** --depi */
	depi: "rgba(125, 189, 198, 0.678)",
	/** --today */
	today: "rgba(255, 210, 217, 0.904)",
	/** Login.css */
	loginBg: "#F9D9DE",
	loginCard: "rgba(240, 169, 173, 0.5)",
	/** --white / --black */
	white: "#FFFFFF",
	black: "#333333",
	/** bordes */
	border: "#AAAAAA",
	borderSoft: "#999999",
	/** textos */
	muted: "#666666",
	mutedLight: "#b9b9b9ff",
	danger: "#CE1E1E",
	serverError: "darkred",
	transparent: "transparent",
} as const

export const spacing = {
	xs: 4,
	sm: 8,
	md: 12,
	lg: 16,
	xl: 24,
	xxl: 32,
} as const

export const radius = {
	sm: 6,
	md: 8,
	lg: 12,
	pill: 999,
} as const

export const fontSize = {
	xs: 12,
	sm: 14,
	md: 16,
	lg: 18,
	xl: 22,
	xxl: 28,
} as const

export const theme = { colors, spacing, radius, fontSize } as const

export type Theme = typeof theme
