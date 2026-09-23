import type { schema } from "@monorepo-template/drizzle";

export type CreateUserParams = Omit<
	typeof schema.users.$inferInsert,
	"id" | "createdAt" | "updatedAt"
>;
export type UpdateUserParams = Partial<
	Pick<typeof schema.users.$inferInsert, "username" | "name">
>;
