import { API_ERROR } from "@monorepo-template/common/constants";
import { type Database, eq, schema } from "@monorepo-template/drizzle";
import type { CreatePostParams, UpdatePostParams } from "./posts.type.js";

export class PostsService {
	constructor(private drizzle: Database) {}

	async findPosts() {
		return await this.drizzle.query.posts.findMany();
	}

	async findPostsByUser(userId: number) {
		return await this.drizzle.query.posts.findMany({
			where: { authorId: userId },
		});
	}

	async findPostById(postId: number) {
		return await this.drizzle.query.posts.findFirst({
			where: { id: postId },
		});
	}

	async createPost(payload: CreatePostParams) {
		const [created] = await this.drizzle
			.insert(schema.posts)
			.values(payload)
			.returning();
		return created;
	}

	async updatePost(postId: number, payload: UpdatePostParams) {
		const post = await this.findPostById(postId);
		if (!post) {
			return API_ERROR.POST_NOT_FOUND;
		}
		const [updated] = await this.drizzle
			.update(schema.posts)
			.set(payload)
			.where(eq(schema.posts.id, postId))
			.returning();
		return updated;
	}

	async deletePost(postId: number) {
		const post = await this.findPostById(postId);
		if (!post) {
			return API_ERROR.POST_NOT_FOUND;
		}
		const [deleted] = await this.drizzle
			.delete(schema.posts)
			.where(eq(schema.posts.id, postId))
			.returning();
		return deleted;
	}
}
