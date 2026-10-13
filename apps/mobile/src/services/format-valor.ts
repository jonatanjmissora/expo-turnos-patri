/** Formatea un valor entero con separador de miles ('.'). Ej. 12000 -> '12.000'. */
export function formatValor(valor: number): string {
	const valorStr = Math.trunc(valor).toString()
	const isNegative = valorStr.startsWith("-")
	const digits = isNegative ? valorStr.slice(1) : valorStr
	const withDots = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
	return isNegative ? `-${withDots}` : withDots
}
