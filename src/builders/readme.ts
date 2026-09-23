export function buildReadme(
	name: string,
	backend: string,
	frontend: string,
	orm: string,
): string {
	const lines: string[] = [`# ${name}`, ""];

	const stack: string[] = [];
	if (backend === "hono")
		stack.push(
			"- **Backend**: Hono (OpenAPI · RPC client) — `http://localhost:4000`",
		);
	if (frontend === "react")
		stack.push(
			"- **Frontend**: React 19 (TanStack Router · TanStack Query · Tailwind v4) — `http://localhost:5173`",
		);
	if (orm === "prisma") stack.push("- **ORM**: Prisma — PostgreSQL");
	if (orm === "drizzle") stack.push("- **ORM**: Drizzle — PostgreSQL");
	stack.push("- **Tooling**: pnpm workspaces · TypeScript · Biome");
	lines.push("## Stack", "", ...stack, "");

	lines.push("## Prerequisites", "");
	lines.push("- [Node.js](https://nodejs.org) ≥ 22");
	lines.push("- [pnpm](https://pnpm.io) ≥ 12");
	if (orm !== "none") lines.push("- [Docker](https://www.docker.com)");
	lines.push("");

	lines.push("## First-time setup", "");
	lines.push("```bash");
	if (backend === "hono")
		lines.push("cp .env.example .env   # configure the app");
	if (orm !== "none") lines.push("docker compose up -d   # start PostgreSQL");
	if (orm === "prisma") {
		lines.push("pnpm prisma:migrate    # run migrations");
		lines.push("pnpm prisma:generate   # generate Prisma client");
	}
	if (orm === "drizzle") {
		lines.push("pnpm drizzle:push      # apply schema to DB");
	}
	lines.push("pnpm dev               # build libs + start dev servers");
	lines.push("```", "");

	lines.push("## Commands", "");
	lines.push("| Command | Description |");
	lines.push("|---------|-------------|");
	lines.push("| `pnpm dev` | Build all libs and start dev servers |");
	if (backend === "hono")
		lines.push("| `pnpm hono:dev` | Start Hono in watch mode |");
	if (frontend === "react")
		lines.push("| `pnpm react:dev` | Start React dev server |");
	if (orm === "prisma") {
		lines.push("| `pnpm prisma:migrate` | Run pending migrations |");
		lines.push("| `pnpm prisma:generate` | Regenerate Prisma client |");
		lines.push("| `pnpm prisma:deploy` | Deploy migrations (production) |");
	}
	if (orm === "drizzle") {
		lines.push("| `pnpm drizzle:push` | Push schema changes to the DB |");
		lines.push("| `pnpm drizzle:generate` | Generate migration files |");
		lines.push("| `pnpm drizzle:migrate` | Run pending migrations |");
	}
	lines.push("");

	if (backend !== "none" || frontend !== "none") {
		lines.push("## Production (Docker)", "");
		lines.push(
			"`Dockerfile` builds every brick in one multi-stage image; `docker-compose.prod.yaml` wires them.",
		);
		if (orm !== "none")
			lines.push(
				"Database credentials come from `.env`; migrations run before the API starts.",
			);
		lines.push("");
		lines.push("```bash");
		lines.push("docker compose -f docker-compose.prod.yaml up -d --build");
		lines.push("```", "");
		const ports: string[] = [];
		if (frontend === "react")
			ports.push("`WEB_PORT` (default 8080) serves the frontend");
		if (backend === "hono" && frontend === "none")
			ports.push("`API_PORT` (default 4000) serves the API");
		if (backend === "hono" && frontend === "react")
			ports.push(
				"the API is only reachable through the frontend proxy on `/api`",
			);
		lines.push(`Ports: ${ports.join("; ")}.`, "");
	}

	lines.push("## Structure", "");
	lines.push("```");
	lines.push(`${name}/`);
	if (backend !== "none" || frontend !== "none") {
		lines.push("├── apps/");
		if (backend === "hono")
			lines.push("│   ├── hono/          # Backend  → http://localhost:4000");
		if (frontend === "react")
			lines.push("│   └── react/         # Frontend → http://localhost:5173");
	}
	if (orm !== "none") {
		lines.push("├── db/");
		if (orm === "prisma")
			lines.push("│   └── prisma/        # Schema & migrations");
		if (orm === "drizzle")
			lines.push("│   └── drizzle/       # Schema & migrations");
	}
	lines.push("├── packages/");
	lines.push("│   ├── common/        # Shared types & schemas");
	if (backend === "hono")
		lines.push("│   ├── infra/         # Logger (Pino), OpenAPI helpers");
	if (backend === "hono")
		lines.push(
			orm === "none"
				? "│   └── services/      # Business logic (HealthService…)"
				: "│   └── services/      # Business logic (PostsService, UsersService…)",
		);
	lines.push("├── biome.json");
	if (backend !== "none" || frontend !== "none") {
		lines.push("├── Dockerfile");
		lines.push("├── docker-compose.prod.yaml   # production stack");
	}
	if (orm !== "none")
		lines.push("├── docker-compose.yaml        # dev database");
	lines.push("└── pnpm-workspace.yaml");
	lines.push("```", "");

	return lines.join("\n");
}
