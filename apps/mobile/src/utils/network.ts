import * as Network from "expo-network"

/** `true` si no hay conexión (o no hay internet alcanzable). */
export async function isOffline(): Promise<boolean> {
	try {
		const state = await Network.getNetworkStateAsync()
		return state.isConnected === false || state.isInternetReachable === false
	} catch {
		return false
	}
}

/** Hook reactivo: `true` cuando el dispositivo está offline. */
export function useIsOffline(): boolean {
	const state = Network.useNetworkState()
	return state.isConnected === false || state.isInternetReachable === false
}
