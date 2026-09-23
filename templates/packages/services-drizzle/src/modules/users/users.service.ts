import { API_ERROR } from "@monorepo-template/common/constants";
import { type Database, eq, schema } from "@monorepo-template/drizzle";
import type { CreateUserParams, UpdateUserParams } from "./users.type.js";

export class UsersService {
	constructor(private drizzle: Database) {}

	async findUsers() {
		return await this.drizzle.query.users.findMany();
	}

	async findUserById(userId: number) {
		return await this.drizzle.query.users.findFirst({
			where: { id: userId },
		});
	}

	async findUserByEmail(email: string) {
		return await this.drizzle.query.users.findFirst({
			where: { email },
		});
	}

	async createUser(payload: CreateUserParams) {
		const user = await this.findUserByEmail(payload.email);
		if (user) {
			return API_ERROR.EMAIL_ALREADY_EXISTS;
		}
		const [created] = await this.drizzle
			.insert(schema.users)
			.values(payload)
			.returning();
		return created;
	}

	async updateUser(userId: number, payload: UpdateUserParams) {
		const user = await this.findUserById(userId);
		if (!user) {
			return API_ERROR.USER_NOT_FOUND;
		}
		const [updated] = await this.drizzle
			.update(schema.users)
			.set(payload)
			.where(eq(schema.users.id, userId))
			.returning();
		return updated;
	}

	async deleteUser(userId: number) {
		const user = await this.findUserById(userId);
		if (!user) {
			return API_ERROR.USER_NOT_FOUND;
		}
		const [deleted] = await this.drizzle
			.delete(schema.users)
			.where(eq(schema.users.id, userId))
			.returning();
		return deleted;
	}
}
