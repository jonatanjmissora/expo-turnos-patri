import { appMetaRepository } from "@/repositories/app-meta.repository"

const RESTORE_CHECKED_KEY = "restore_checked"

/**
 * Bandera "restore evaluado" por instalación. Se guarda en SQLite (se borra al
 * reinstalar), así el restore/merge se corre una vez por instalación.
 */
export async function isRestoreChecked(): Promise<boolean> {
	return (await appMetaRepository.get(RESTORE_CHECKED_KEY)) === "1"
}

export async function setRestoreChecked(): Promise<void> {
	await appMetaRepository.set(RESTORE_CHECKED_KEY, "1")
}
