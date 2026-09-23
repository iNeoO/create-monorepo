import { defineConfig } from "prisma/config";

// Read directly from the environment (loaded by `dotenv -e .env` in the root
// scripts) so that `prisma generate` works without a database or a built infra.
export default defineConfig({
	schema: "prisma/schema.prisma",
	migrations: {
		path: "prisma/migrations",
	},
	datasource: {
		url: process.env.PG_URL ?? "",
	},
});
