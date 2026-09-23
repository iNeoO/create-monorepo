import { defineConfig } from "drizzle-kit";

// Read directly from the environment (loaded by `dotenv -e .env` in the root scripts).
export default defineConfig({
	out: "./drizzle",
	schema: "./src/db/schema.ts",
	dialect: "postgresql",
	dbCredentials: {
		url: process.env.PG_URL ?? "",
	},
});
