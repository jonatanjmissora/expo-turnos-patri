import { Feather } from "@expo/vector-icons"
import { Redirect, Tabs } from "expo-router"
import { colors, fontSize } from "@/constants/theme"
import { useSession } from "@/session/session-context"

export default function TabsLayout() {
	const { isAuthenticated, isReady } = useSession()

	if (!isReady) return null
	if (!isAuthenticated) return <Redirect href="/auth/login" />

	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarActiveTintColor: colors.black,
				tabBarInactiveTintColor: colors.mutedLight,
				tabBarStyle: {
					backgroundColor: colors.white,
					borderTopColor: colors.border,
				},
				tabBarLabelStyle: { fontSize: fontSize.xs, fontWeight: "600" },
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "Turnos",
					tabBarIcon: ({ color }) => (
						<Feather name="calendar" color={color} size={22} />
					),
				}}
			/>
			<Tabs.Screen
				name="clientas"
				options={{
					title: "Clientas",
					tabBarIcon: ({ color }) => (
						<Feather name="users" color={color} size={22} />
					),
				}}
			/>
		</Tabs>
	)
}
