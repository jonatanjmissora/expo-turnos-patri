import { useSyncExternalStore } from "react"

export type SyncActivityState = {
	active: boolean
	done: number
	total: number
}

let state: SyncActivityState = { active: false, done: 0, total: 0 }
const listeners = new Set<() => void>()

function emit() {
	for (const listener of listeners) listener()
}

function subscribe(listener: () => void): () => void {
	listeners.add(listener)
	return () => {
		listeners.delete(listener)
	}
}

function getSnapshot(): SyncActivityState {
	return state
}

/** Inicia la actividad de sync con el total de operaciones a enviar. */
export function startSyncActivity(total: number) {
	state = { active: true, done: 0, total }
	emit()
}

export function setSyncProgress(done: number) {
	state = { ...state, done }
	emit()
}

export function finishSyncActivity() {
	state = { ...state, active: false }
	emit()
}

export function useSyncActivity(): SyncActivityState {
	return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
