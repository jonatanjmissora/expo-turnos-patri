import { useQuery } from "@tanstack/react-query"
import { syncQueueRepository } from "@/repositories/sync-queue.repository"
import { useUserId } from "@/session/session-context"
import { syncKeys } from "../keys/sync.keys"

/** Cantidad de operaciones pendientes de sincronizar del usuario activo. */
export function useSyncStatus() {
	const userId = useUserId()
	const query = useQuery({
		queryKey: syncKeys.pending(userId ?? ""),
		queryFn: () => syncQueueRepository.getCountByUserId(userId as string),
		enabled: Boolean(userId),
		staleTime: 0,
	})

	return { pendingCount: query.data ?? 0, refetch: query.refetch }
}
