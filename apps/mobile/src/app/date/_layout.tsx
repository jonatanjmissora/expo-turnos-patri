import { Stack } from "expo-router"
import { colors } from "@/constants/theme"

export default function DateLayout() {
	return (
		<Stack
			screenOptions={{
				headerShown: true,
				headerStyle: { backgroundColor: colors.cell },
				headerTintColor: colors.black,
			}}
		/>
	)
}
