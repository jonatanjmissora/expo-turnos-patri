export const syncKeys = {
	all: ["sync"] as const,
	pending: (userId: string) => [...syncKeys.all, "pending", userId] as const,
}
