import { checkbox, input, select } from "@inquirer/prompts";

export type Answers = {
	projectName: string;
	backend: "hono" | "none";
	frontend: "react" | "none";
	orm: "prisma" | "drizzle" | "none";
	skills: string[];
};

export async function askQuestions(): Promise<Answers> {
	const projectName = await input({
		message: "Project name:",
		default: "my-app",
		validate: (value) => {
			if (!value.trim()) return "Project name cannot be empty";
			if (!/^[a-z0-9-]+$/.test(value))
				return "Use only lowercase letters, numbers, and hyphens";
			return true;
		},
	});

	const backend = await select<"hono" | "none">({
		message: "Backend:",
		choices: [
			{ value: "hono", name: "Hono  (OpenAPI · RPC client)" },
			{ value: "none", name: "None" },
		],
	});

	const frontend = await select<"react" | "none">({
		message: "Frontend:",
		choices: [
			{
				value: "react",
				name: "React  (TanStack Router + Query · Tailwind v4)",
			},
			{ value: "none", name: "None" },
		],
	});

	let orm: "prisma" | "drizzle" | "none" = "none";
	if (backend === "hono") {
		orm = await select<"prisma" | "drizzle" | "none">({
			message: "ORM:",
			choices: [
				{ value: "prisma", name: "Prisma  (PostgreSQL)" },
				{ value: "drizzle", name: "Drizzle  (PostgreSQL)" },
				{ value: "none", name: "None" },
			],
		});
	}

	const skills = await checkbox({
		message: "Claude Code skills:",
		choices: [
			{
				value: "create-hono-endpoint",
				name: "create-hono-endpoint  — scaffold a new API module",
			},
		],
	});

	return { projectName, backend, frontend, orm, skills };
}
