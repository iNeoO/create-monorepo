import { apiError } from "@monorepo-template/infra/helpers";
import { logMiddleware } from "@monorepo-template/infra/middlewares";
import { Hono } from "hono";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { errorHandler } from "./helpers/errors.helper.js";
import { createHealthController } from "./modules/health/health.controller.js";
import { createPostsController } from "./modules/posts/posts.controller.js";
import { createUsersController } from "./modules/users/users.controller.js";
import type { AppServices } from "./services/container.js";

export const createApp = (services: AppServices) => {
	return new Hono()
		.use(requestId())
		.use(logMiddleware)
		.use(secureHeaders())
		.route("health", createHealthController(services.health))
		.route("users", createUsersController(services.users))
		.route("posts", createPostsController(services.posts))
		.notFound((c) => apiError(c, "NOT_FOUND"))
		.onError(errorHandler);
};
