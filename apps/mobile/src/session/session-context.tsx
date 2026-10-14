import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react"
import { Alert } from "react-native"
import { setOnUnauthorized } from "../api/client"
import { signOut as authSignOut } from "../auth/auth.service"
import { queryClient } from "../query/query-client"
import { purgeOldTurnosIfDue } from "../sync/purge"
import { pullMergeSilent } from "../sync/restore"
import {
	clearSession,
	initSession,
	setSession as persistSession,
} from "./session.service"

type SessionContextValue = {
	activeUserId: string | null
	isAuthenticated: boolean
	/** `false` mientras se hidrata la sesión desde SecureStore. */
	isReady: boolean
	setSession: (userId: string, token: string | null) => Promise<void>
	signOut: () => Promise<void>
}

const SessionContext = createContext<SessionContextValue | null>(null)

/** Purga local de turnos viejos, en background y silenciosa (best-effort). */
function purgeInBackground(userId: string | null) {
	if (!userId) return
	void purgeOldTurnosIfDue(userId).catch(() => {})
}

export function SessionProvider({ children }: { children: ReactNode }) {
	const [activeUserId, setActiveUserId] = useState<string | null>(null)
	const [isReady, setIsReady] = useState(false)
	const userIdRef = useRef<string | null>(null)

	const setActiveUserIdState = (userId: string | null) => {
		userIdRef.current = userId
		setActiveUserId(userId)
	}

	useEffect(() => {
		let active = true
		;(async () => {
			const session = await initSession()
			if (!active) return
			setActiveUserIdState(session?.userId ?? null)
			setIsReady(true)
		})()
		return () => {
			active = false
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	// Si un endpoint con sesión responde 401, la sesión expiró: purga local en
	// background, limpiamos y avisamos. El guard de navegación redirige a login.
	useEffect(() => {
		setOnUnauthorized(reason => {
			void (async () => {
				purgeInBackground(userIdRef.current)
				await clearSession()
				queryClient.clear()
				setActiveUserIdState(null)

				Alert.alert(
					reason === "no_session" ? "No estás conectado" : "Sesión expirada",
					"Iniciá sesión de nuevo para continuar."
				)
			})()
		})
		return () => setOnUnauthorized(null)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const setSession = async (userId: string, token: string | null) => {
		await persistSession(userId, token)
		queryClient.clear()
		setActiveUserIdState(userId)

		// Pull silencioso al loguear: trae y mergea (LWW) lo que haya en la nube
		// (p. ej. datos importados desde afuera), sin interrumpir al usuario.
		// Se invalida el caché SIEMPRE (aunque falle), para que la UI use lo local.
		void (async () => {
			try {
				await pullMergeSilent(userId)
			} catch {
				// best-effort; se reintenta en el próximo login
			} finally {
				await queryClient.invalidateQueries()
			}
		})()
	}

	const signOut = async () => {
		const current = activeUserId
		await authSignOut()
		purgeInBackground(current)
		queryClient.clear()
		setActiveUserIdState(null)
	}

	return (
		<SessionContext.Provider
			value={{
				activeUserId,
				isAuthenticated: activeUserId !== null,
				isReady,
				setSession,
				signOut,
			}}
		>
			{children}
		</SessionContext.Provider>
	)
}

export function useSession(): SessionContextValue {
	const context = useContext(SessionContext)
	if (!context) {
		throw new Error("useSession debe usarse dentro de SessionProvider")
	}
	return context
}

/** `userId` activo (string) cuando hay sesión, o `null`. */
export function useUserId(): string | null {
	return useSession().activeUserId
}
