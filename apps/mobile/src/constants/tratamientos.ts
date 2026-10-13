export const TRATAMIENTO_OPTIONS = [
	"servis semipermanente",
  "servis esculpidas",
  "esculpidas",
  "semipermanente",
  "depilacion",
  "belleza de pies",
  "spa de pies",
  "otro"
] as const

export type TratamientoOption = (typeof TRATAMIENTO_OPTIONS)[number]

export const DEPILACION_OPTIONS = [
	 "Bozo",
  "Cavado completo",
  "Bikini",
  "Piernas",
  "Brazos",
  "Rostro",
  "Menton",
  "Axilas",
  "Espalda",
  "Gluteos",
  "Abdomen"
] as const

export type DepilacionOption = (typeof DEPILACION_OPTIONS)[number]

/** Separador usado para unir las opciones de depilación en un solo string. */
export const DEPI_SEPARATOR = " / "
