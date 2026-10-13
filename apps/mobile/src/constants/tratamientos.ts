export const TRATAMIENTO_OPTIONS = [
	"maderoterapia",
	"lifting",
	"perfilado",
	"lifting + higiene",
	"facial profundo",
	"facial premium",
	"uñas",
	"evaluacion",
	"depilacion",
	"otro",
] as const

export type TratamientoOption = (typeof TRATAMIENTO_OPTIONS)[number]

export const DEPILACION_OPTIONS = [
	"Pierna Entera",
	"Media Pierna",
	"Axila",
	"Brazos",
	"Bozo",
	"Rostro Completo",
	"Pecho",
	"Espalda Baja",
	"Espalda",
	"Cavado Completo con Tiro",
	"Cavado Completo sin Tiro",
] as const

export type DepilacionOption = (typeof DEPILACION_OPTIONS)[number]

/** Separador usado para unir las opciones de depilación en un solo string. */
export const DEPI_SEPARATOR = " / "
