import { Alert } from "react-native"
import { apiSyncClear, apiSyncList } from "@/api/client"
import { LOCAL_ENTITIES, type LocalEntity } from "@/db/local-entities"
import {
	type LocalSyncRecord,
	syncLocalRepository,
} from "@/repositories/sync-local.repository"
import { syncQueueRepository } from "@/repositories/sync-queue.repository"
import { finishSyncActivity, startSyncActivity } from "./sync-activity"

type CloudItem = Record<string, unknown> & { id: string; updatedAt: string }

type CloudSnapshot = Record<
	string,
	{ items: CloudItem[]; deletedIds: string[] }
>

function ask(
	title: string,
	message: string,
	buttons: { text: string; value: string; destructive?: boolean }[]
): Promise<string> {
	return new Promise(resolve => {
		Alert.alert(
			title,
			message,
			buttons.map(button => ({
				text: button.text,
				style: button.destructive ? "destructive" : "default",
				onPress: () => resolve(button.value),
			})),
			{ cancelable: false }
		)
	})
}

async function clearQueue(userId: string): Promise<void> {
	const entries = await syncQueueRepository.getAllByUserId(userId)
	await syncQueueRepository.removeMany(entries.map(entry => entry.id))
}

/**
 * Segunda verificación para acciones destructivas. Devuelve `true` solo si el
 * usuario confirma explícitamente.
 */
async function confirmDestructive(message: string): Promise<boolean> {
	const choice = await ask("Confirmar", message, [
		{ text: "Cancelar", value: "cancel" },
		{ text: "Sí, continuar", value: "confirm", destructive: true },
	])
	return choice === "confirm"
}

async function applyCloudAll(
	userId: string,
	cloud: CloudSnapshot,
	options: { replace: boolean }
): Promise<void> {
	for (const entity of LOCAL_ENTITIES) {
		const snapshot = cloud[entity.key]
		if (!snapshot || snapshot.items.length === 0) {
			if (options.replace) {
				await syncLocalRepository.applyCloud(entity.key, userId, [], {
					replace: true,
				})
			}
			continue
		}
		await syncLocalRepository.applyCloud(entity.key, userId, snapshot.items, {
			replace: options.replace,
		})
	}
}

async function clearCloud(userId: string): Promise<void> {
	for (const entity of LOCAL_ENTITIES) {
		try {
			await apiSyncClear(entity.key)
		} catch {
			// best-effort
		}
	}
	await clearQueue(userId)
}

async function enqueueLocalAll(userId: string): Promise<void> {
	for (const entity of LOCAL_ENTITIES) {
		const local = await syncLocalRepository.getAll(entity.key, userId)
		for (const record of local) {
			await syncQueueRepository.enqueue(
				userId,
				entity.key,
				record.id as string,
				"upsert"
			)
		}
	}
}

async function mergeEntityLocally(
	entity: LocalEntity,
	userId: string,
	cloud: CloudItem[],
	deletedIds: string[],
	local: LocalSyncRecord[]
): Promise<void> {
	const deleted = new Set(deletedIds)

	// 1. Respeta tombstones: borra local lo que la nube borró (no lo sube).
	const localDeleted = local
		.filter(record => deleted.has(record.id))
		.map(record => record.id)
	await syncLocalRepository.removeByIds(entity.key, localDeleted)

	const liveLocal = local.filter(record => !deleted.has(record.id))
	const localById = new Map(liveLocal.map(record => [record.id, record]))
	const cloudById = new Map(cloud.map(item => [String(item.id), item]))

	// 2. Baja de la nube lo solo-nube o más nuevo.
	const fromCloud = cloud.filter(item => {
		const localItem = localById.get(String(item.id))
		return (
			!localItem ||
			Date.parse(item.updatedAt) > Date.parse(localItem.updatedAt)
		)
	})
	if (fromCloud.length > 0) {
		await syncLocalRepository.applyCloud(entity.key, userId, fromCloud, {
			replace: false,
		})
	}

	// 3. Sube lo local solo-nuevo o más nuevo.
	const toUpload = liveLocal.filter(record => {
		const cloudItem = cloudById.get(record.id)
		return (
			!cloudItem || Date.parse(record.updatedAt) > Date.parse(cloudItem.updatedAt)
		)
	})
	for (const record of toUpload) {
		await syncQueueRepository.enqueue(
			userId,
			entity.key,
			record.id,
			"upsert"
		)
	}
}

/**
 * Pull silencioso: baja la nube y mergea (LWW) con lo local, **sin prompts**.
 * Se usa al loguear para traer datos que se agregaron en la nube desde afuera
 * (p. ej. una migración hecha manualmente). Encola lo local más nuevo.
 */
export async function pullMergeSilent(userId: string): Promise<void> {
	for (const entity of LOCAL_ENTITIES) {
		const remote = await apiSyncList<CloudItem>(entity.key)
		const local = await syncLocalRepository.getAll(entity.key, userId)
		await mergeEntityLocally(
			entity,
			userId,
			remote.items,
			remote.deletedIds,
			local
		)
	}
}

/**
 * Restore/merge: se corre una vez por instalación, tras loguear. Decide el
 * estado global (4 combinaciones) y aplica la política elegida por el usuario.
 * Muestra la barra de sync (indeterminada) mientras trae/aplica datos.
 */
export async function runRestoreFlow(userId: string): Promise<void> {
	startSyncActivity(0)
	try {
		await runRestoreFlowInner(userId)
	} finally {
		finishSyncActivity()
	}
}

async function runRestoreFlowInner(userId: string): Promise<void> {
	const cloud: CloudSnapshot = {}
	let localTotal = 0
	let cloudTotal = 0

	for (const entity of LOCAL_ENTITIES) {
		const local = await syncLocalRepository.getAll(entity.key, userId)
		const remote = await apiSyncList<CloudItem>(entity.key)
		cloud[entity.key] = { items: remote.items, deletedIds: remote.deletedIds }
		localTotal += local.length
		cloudTotal += remote.items.length
	}

	// Ambos vacíos: nada que hacer.
	if (localTotal === 0 && cloudTotal === 0) return

	// Solo local: subir (silencioso).
	if (cloudTotal === 0) {
		await enqueueLocalAll(userId)
		return
	}

	// Solo nube: elegir (con doble confirmación para "Empezar de cero").
	if (localTotal === 0) {
		for (;;) {
			const choice = await ask(
				"Hay datos en la nube",
				"¿Querés trabajar con los datos de la nube o empezar de cero?",
				[
					{ text: "Trabajar con la nube", value: "cloud" },
					{ text: "Empezar de cero", value: "empty", destructive: true },
				]
			)

			if (choice === "cloud") {
				await applyCloudAll(userId, cloud, { replace: true })
				return
			}

			const confirmed = await confirmDestructive(
				"Empezar de cero eliminará TODOS los turnos guardados en la nube. Esta acción no se puede deshacer."
			)
			if (confirmed) {
				await clearCloud(userId)
				return
			}
			// Canceló: volvemos a preguntar.
		}
	}

	// Ambos con datos: combinar / solo nube / solo local.
	for (;;) {
		const choice = await ask(
			"Hay datos locales y en la nube",
			"¿Cómo querés combinarlos?",
			[
				{ text: "Combinar", value: "merge" },
				{ text: "Solo nube", value: "cloud", destructive: true },
				{ text: "Solo local", value: "local", destructive: true },
			]
		)

		if (choice === "merge") break

		if (choice === "cloud") {
			const confirmed = await confirmDestructive(
				"Se descartarán los turnos guardados en este dispositivo. Esta acción no se puede deshacer."
			)
			if (confirmed) {
				await clearQueue(userId)
				await applyCloudAll(userId, cloud, { replace: true })
				return
			}
			continue
		}

		const confirmed = await confirmDestructive(
			"Se eliminarán TODOS los turnos guardados en la nube. Esta acción no se puede deshacer."
		)
		if (confirmed) {
			await clearCloud(userId)
			await enqueueLocalAll(userId)
			return
		}
	}

	// Combinar.
	for (const entity of LOCAL_ENTITIES) {
		const snapshot = cloud[entity.key]
		if (!snapshot) continue
		const local = await syncLocalRepository.getAll(entity.key, userId)
		await mergeEntityLocally(
			entity,
			userId,
			snapshot.items,
			snapshot.deletedIds,
			local
		)
	}
}
