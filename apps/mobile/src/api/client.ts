const API_URL = process.env.EXPO_PUBLIC_API_URL ?? ""
const API_TOKEN = process.env.EXPO_PUBLIC_API_TOKEN ?? ""

let sessionToken: string | null = null

/** La capa de sesión inyecta/limpia el token de usuario acá. */
export function setApiSessionToken(token: string | null) {
	sessionToken = token
}

/** Token global de la app (`Authorization: Bearer`). */
export function getApiToken(): string {
	return API_TOKEN
}

type UnauthorizedReason = "no_session" | "invalid_session"

let onUnauthorized: ((reason: UnauthorizedReason) => void) | null = null

/** La capa de sesión registra qué hacer ante un 401 de sesión. */
export function setOnUnauthorized(
	handler: ((reason: UnauthorizedReason) => void) | null
) {
	onUnauthorized = handler
}

export class ApiError extends Error {
	readonly status: number
	readonly code: string | null

	constructor(status: number, code: string | null, message: string) {
		super(message)
		this.name = "ApiError"
		this.status = status
		this.code = code
	}
}

export async function apiFetch<T>(
	path: string,
	options: RequestInit = {}
): Promise<T> {
	if (!API_URL) {
		throw new Error("Falta EXPO_PUBLIC_API_URL")
	}

	const headers: Record<string, string> = {
		"Content-Type": "application/json",
		Authorization: `Bearer ${API_TOKEN}`,
		...((options.headers as Record<string, string>) ?? {}),
	}
	if (sessionToken) {
		headers["x-session-token"] = sessionToken
	}

	const response = await fetch(`${API_URL}${path}`, { ...options, headers })

	if (!response.ok) {
		const text = await response.text().catch(() => "")
		let code: string | null = null
		try {
			code = (JSON.parse(text) as { error?: string }).error ?? null
		} catch {
			code = null
		}

		if (
			response.status === 401 &&
			(code === "no_session" || code === "invalid_session")
		) {
			onUnauthorized?.(code)
		}

		throw new ApiError(
			response.status,
			code,
			`API ${response.status}: ${text || response.statusText}`
		)
	}

	return (await response.json()) as T
}

export type CloudUser = {
	id: string
	email: string
	name: string | null
	userImage: string | null
}

export type AuthResponse = {
	token: string
	user: CloudUser
}

export function apiRegister(
	email: string,
	password: string,
	name?: string
): Promise<AuthResponse> {
	return apiFetch<AuthResponse>("/register", {
		method: "POST",
		body: JSON.stringify({ email, password, name }),
	})
}

export function apiLogin(
	email: string,
	password: string
): Promise<AuthResponse> {
	return apiFetch<AuthResponse>("/login", {
		method: "POST",
		body: JSON.stringify({ email, password }),
	})
}

export function apiMe(): Promise<{ user: CloudUser }> {
	return apiFetch<{ user: CloudUser }>("/me")
}

export function apiLogout(): Promise<{ ok: boolean }> {
	return apiFetch<{ ok: boolean }>("/logout", { method: "POST" })
}

export type SyncItemsResponse<T> = {
	items: T[]
	/** Ids con soft delete en la nube (tombstones). */
	deletedIds: string[]
}

/** Lista los registros vivos de una entidad sincronizable + sus tombstones. */
export function apiSyncList<T>(entity: string): Promise<SyncItemsResponse<T>> {
	return apiFetch<SyncItemsResponse<T>>(`/sync/${entity}`)
}

export function apiSyncPush<T>(
	entity: string,
	payload: { upserts: T[]; deletes: string[] }
): Promise<{ ok: boolean; synced: number }> {
	return apiFetch<{ ok: boolean; synced: number }>(`/sync/${entity}`, {
		method: "POST",
		body: JSON.stringify(payload),
	})
}

export function apiSyncClear(
	entity: string
): Promise<{ ok: boolean; deleted: number }> {
	return apiFetch<{ ok: boolean; deleted: number }>(`/sync/${entity}`, {
		method: "DELETE",
	})
}
