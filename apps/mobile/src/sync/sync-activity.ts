import { useSyncExternalStore } from "react"

export type SyncActivitySection = {
	key: string
	label: string
	done: number
}

type SyncActivityState = {
	active: boolean
	sections: SyncActivitySection[]
}

let state: SyncActivityState = { active: false, sections: [] }
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

export function startSyncActivity(sections: { key: string; label: string }[]) {
	state = {
		active: true,
		sections: sections.map(section => ({ ...section, done: 0 })),
	}
	emit()
}

export function setSectionProgress(key: string, done: number) {
	state = {
		...state,
		sections: state.sections.map(section =>
			section.key === key ? { ...section, done } : section
		),
	}
	emit()
}

export function finishSyncActivity() {
	state = { ...state, active: false }
	emit()
}

export function useSyncActivity(): SyncActivityState {
	return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
