import * as SecureStore from "expo-secure-store"
import { setApiSessionToken } from "../api/client"

const ACTIVE_USER_KEY = "turnos_active_user_id"
const SESSION_TOKEN_KEY = "turnos_session_token"

export type StoredSession = {
	userId: string
	token: string | null
}

/**
 * Carga la sesión persistida y la inyecta en el cliente HTTP.
 * Devuelve `null` si no hay usuario logueado (la app exige login).
 */
export async function initSession(): Promise<StoredSession | null> {
	const userId = await SecureStore.getItemAsync(ACTIVE_USER_KEY)
	const token = await SecureStore.getItemAsync(SESSION_TOKEN_KEY)
	setApiSessionToken(token)
	return userId ? { userId, token } : null
}

export async function getSession(): Promise<StoredSession | null> {
	const userId = await SecureStore.getItemAsync(ACTIVE_USER_KEY)
	const token = await SecureStore.getItemAsync(SESSION_TOKEN_KEY)
	return userId ? { userId, token } : null
}

export async function setSession(
	userId: string,
	token: string | null
): Promise<void> {
	await SecureStore.setItemAsync(ACTIVE_USER_KEY, userId)
	if (token) {
		await SecureStore.setItemAsync(SESSION_TOKEN_KEY, token)
	} else {
		await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY)
	}
	setApiSessionToken(token)
}

export async function clearSession(): Promise<void> {
	await SecureStore.deleteItemAsync(ACTIVE_USER_KEY)
	await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY)
	setApiSessionToken(null)
}
