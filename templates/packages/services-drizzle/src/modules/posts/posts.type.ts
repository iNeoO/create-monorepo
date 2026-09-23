import type { schema } from "@monorepo-template/drizzle";

export type CreatePostParams = Omit<
	typeof schema.posts.$inferInsert,
	"id" | "createdAt" | "updatedAt"
>;
export type UpdatePostParams = Partial<
	Pick<typeof schema.posts.$inferInsert, "title" | "content">
>;
