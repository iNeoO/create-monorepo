import { API_ERROR } from "@monorepo-template/common/constants";
import { appWithLogs } from "@monorepo-template/infra/factories";
import { apiError, validate } from "@monorepo-template/infra/helpers";
import type { PostsService } from "@monorepo-template/services";
import {
	CreatePostRoute,
	DeletePostRoute,
	GetPostRoute,
	GetPostsByUserRoute,
	GetPostsRoute,
	UpdatePostRoute,
} from "./posts.route.js";
import {
	createPostSchema,
	postIdParamSchema,
	postUserIdParamSchema,
	updatePostSchema,
} from "./posts.schema.js";

export const createPostsController = (postsService: PostsService) => {
	return appWithLogs
		.createApp()
		.get("/", GetPostsRoute, async (c) => {
			const posts = await postsService.findPosts();
			return c.json({ data: posts }, 200);
		})
		.get(
			"/user/:userId",
			GetPostsByUserRoute,
			validate("param", postUserIdParamSchema),
			async (c) => {
				const { userId } = c.req.valid("param");
				const posts = await postsService.findPostsByUser(userId);
				return c.json({ data: posts }, 200);
			},
		)
		.get(
			"/:id",
			GetPostRoute,
			validate("param", postIdParamSchema),
			async (c) => {
				const { id } = c.req.valid("param");
				const post = await postsService.findPostById(id);
				if (!post) return apiError(c, "POST_NOT_FOUND");
				return c.json({ data: post }, 200);
			},
		)
		.post(
			"/",
			CreatePostRoute,
			validate("json", createPostSchema),
			async (c) => {
				const body = c.req.valid("json");
				const post = await postsService.createPost(body);
				return c.json({ data: post }, 201);
			},
		)
		.patch(
			"/:id",
			UpdatePostRoute,
			validate("param", postIdParamSchema),
			validate("json", updatePostSchema),
			async (c) => {
				const { id } = c.req.valid("param");
				const body = c.req.valid("json");
				const result = await postsService.updatePost(id, body);
				if (result === API_ERROR.POST_NOT_FOUND)
					return apiError(c, "POST_NOT_FOUND");
				return c.json({ data: result }, 200);
			},
		)
		.delete(
			"/:id",
			DeletePostRoute,
			validate("param", postIdParamSchema),
			async (c) => {
				const { id } = c.req.valid("param");
				const result = await postsService.deletePost(id);
				if (result === API_ERROR.POST_NOT_FOUND)
					return apiError(c, "POST_NOT_FOUND");
				return c.json({ data: result }, 200);
			},
		);
};
