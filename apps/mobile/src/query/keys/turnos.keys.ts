export const turnosKeys = {
	all: ["turnos"] as const,
	byUserId: (userId: string) =>
		[...turnosKeys.all, "byUserId", userId] as const,
	byId: (id: string) => [...turnosKeys.all, "byId", id] as const,
}
