import { useQueryClient } from "@tanstack/react-query"
import { syncKeys } from "@/query/keys/sync.keys"
import { useUserId } from "@/session/session-context"
import { flushAll } from "./sync-manager"

/**
 * Devuelve un callback para usar en `onSuccess` de una mutación: invalida el
 * caché de la entidad + el estado de sync y dispara un `flushAll` best-effort.
 */
export function useAfterEntityChange(allKey: readonly unknown[]) {
	const queryClient = useQueryClient()
	const userId = useUserId()

	return () => {
		queryClient.invalidateQueries({ queryKey: allKey })
		queryClient.invalidateQueries({ queryKey: syncKeys.all })
		if (userId) {
			void flushAll(userId).then(() => {
				queryClient.invalidateQueries({ queryKey: syncKeys.all })
			})
		}
	}
}
