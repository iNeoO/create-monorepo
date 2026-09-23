import { type PrismaClient, prisma } from "@monorepo-template/prisma";
import {
	HealthService,
	PostsService,
	UsersService,
} from "@monorepo-template/services";

export type AppServices = {
	db: PrismaClient;
	health: HealthService;
	posts: PostsService;
	users: UsersService;
};

export const createServices = (): AppServices => {
	return {
		db: prisma,
		health: new HealthService(prisma),
		posts: new PostsService(prisma),
		users: new UsersService(prisma),
	};
};

export const services = createServices();
