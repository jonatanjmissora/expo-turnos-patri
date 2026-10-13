import { useSyncExternalStore } from "react"

export type ToastType = "info" | "success" | "warning" | "error"

export type Toast = {
	id: string
	message: string
	type: ToastType
}

let toasts: Toast[] = []
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

function getSnapshot(): Toast[] {
	return toasts
}

let counter = 0

/** Muestra un toast por unos segundos. */
export function showToast(message: string, type: ToastType = "info") {
	const id = `${Date.now()}-${counter++}`
	toasts = [...toasts, { id, message, type }]
	emit()

	setTimeout(() => {
		toasts = toasts.filter(toast => toast.id !== id)
		emit()
	}, 3500)
}

export function useToasts(): Toast[] {
	return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
