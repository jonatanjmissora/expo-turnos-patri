import * as Crypto from "expo-crypto"

/**
 * Hash local de contraseña (para permitir login offline).
 *
 * Salted SHA-256 con iteraciones. No es un KDF nativo (bcrypt/scrypt/argon2),
 * pero sumado al salt por usuario encarece la fuerza bruta. El objetivo es
 * exclusivamente habilitar el ingreso local sin conexión; las credenciales
 * "reales" las valida la nube (scrypt).
 */
const ITERATIONS = 1000

async function derive(password: string, salt: string): Promise<string> {
	let value = `${salt}:${password}`
	for (let i = 0; i < ITERATIONS; i++) {
		value = await Crypto.digestStringAsync(
			Crypto.CryptoDigestAlgorithm.SHA256,
			value
		)
	}
	return value
}

export async function hashPassword(password: string): Promise<string> {
	const salt = Crypto.randomUUID()
	const hash = await derive(password, salt)
	return `${salt}:${hash}`
}

export async function verifyPassword(
	password: string,
	stored: string | null
): Promise<boolean> {
	if (!stored) return false
	const [salt, hash] = stored.split(":")
	if (!salt || !hash) return false
	const candidate = await derive(password, salt)
	return candidate === hash
}
