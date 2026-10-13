import { QueryClientProvider } from "@tanstack/react-query"
import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { queryClient } from "@/query/query-client"
import { SessionProvider } from "@/session/session-context"
import { SyncBootstrap } from "@/sync/SyncBootstrap"
import { SyncProgressBar } from "@/ui/SyncProgressBar"
import { ToastHost } from "@/ui/ToastHost"

export default function RootLayout() {
	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<SafeAreaProvider>
				<QueryClientProvider client={queryClient}>
					<SessionProvider>
						<SyncBootstrap />
						<Stack screenOptions={{ headerShown: false }}>
							<Stack.Screen name="(tabs)" />
							<Stack.Screen name="auth" />
							<Stack.Screen name="turno" options={{ presentation: "modal" }} />
							<Stack.Screen name="date" />
						</Stack>
						<SyncProgressBar />
						<ToastHost />
						<StatusBar style="dark" />
					</SessionProvider>
				</QueryClientProvider>
			</SafeAreaProvider>
		</GestureHandlerRootView>
	)
}
