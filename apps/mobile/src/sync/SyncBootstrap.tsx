import { useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { useUserId } from "@/session/session-context"
import { useIsOffline } from "@/utils/network"
import { runRestoreFlow } from "./restore"
import { isRestoreChecked, setRestoreChecked } from "./restore-flag"
import { flushAll } from "./sync-manager"

/**
 * Bootstrap de sync: montado en el `_layout` (dentro del `SessionProvider`).
 * Al loguear y al recuperar conexión: corre el restore (una vez por instalación)
 * y vacía la cola. La purga local de turnos viejos corre en background al perder
 * la sesión (ver `session-context`).
 */
export function SyncBootstrap() {
	const userId = useUserId()
	const offline = useIsOffline()
	const queryClient = useQueryClient()

	useEffect(() => {
		if (!userId || offline) return
		let active = true

		void (async () => {
			try {
				if (!(await isRestoreChecked())) {
					await runRestoreFlow(userId)
					if (!active) return
					await setRestoreChecked()
				}

				const result = await flushAll(userId, { notify: true })
				if (active && result.synced > 0) {
					await queryClient.invalidateQueries()
				}
			} catch {
				// Si falla (p. ej. red), se reintenta en el próximo arranque/reconexión.
			}
		})()

		return () => {
			active = false
		}
	}, [userId, offline, queryClient])

	return null
}
