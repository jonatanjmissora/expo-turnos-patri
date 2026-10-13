import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useState,
} from "react"
import { Alert } from "react-native"
import { setOnUnauthorized } from "../api/client"
import { signOut as authSignOut } from "../auth/auth.service"
import { queryClient } from "../query/query-client"
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

export function SessionProvider({ children }: { children: ReactNode }) {
	const [activeUserId, setActiveUserId] = useState<string | null>(null)
	const [isReady, setIsReady] = useState(false)

	useEffect(() => {
		let active = true
		;(async () => {
			const session = await initSession()
			if (!active) return
			setActiveUserId(session?.userId ?? null)
			setIsReady(true)
		})()
		return () => {
			active = false
		}
	}, [])

	// Si un endpoint con sesión responde 401, la sesión expiró: limpiamos y
	// avisamos. El guard de navegación redirige a /auth/login.
	useEffect(() => {
		setOnUnauthorized(reason => {
			void (async () => {
				await clearSession()
				queryClient.clear()
				setActiveUserId(null)

				Alert.alert(
					reason === "no_session" ? "No estás conectado" : "Sesión expirada",
					"Iniciá sesión de nuevo para continuar."
				)
			})()
		})
		return () => setOnUnauthorized(null)
	}, [])

	const setSession = async (userId: string, token: string | null) => {
		await persistSession(userId, token)
		queryClient.clear()
		setActiveUserId(userId)
	}

	const signOut = async () => {
		await authSignOut()
		queryClient.clear()
		setActiveUserId(null)
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
