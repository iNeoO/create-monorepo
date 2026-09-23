/**
 * Production compose: builds every selected brick from the root Dockerfile.
 * PostgreSQL credentials and FRONTEND_URL come from `.env`; PG_URL is
 * rewritten to point at the `postgres` service.
 */
export function buildProdCompose(
	name: string,
	backend: string,
	frontend: string,
	orm: string,
): string {
	const pgUrl = "postgresql://${PG_USER}:${PG_PASSWORD}@postgres:5432/${PG_DB}";
	const lines: string[] = [
		"# Production: `docker compose -f docker-compose.prod.yaml up -d --build`",
		"services:",
	];

	if (orm !== "none") {
		lines.push(
			"  postgres:",
			"    image: postgres:18-alpine",
			"    environment:",
			"      POSTGRES_DB: ${PG_DB}",
			"      POSTGRES_USER: ${PG_USER}",
			"      POSTGRES_PASSWORD: ${PG_PASSWORD}",
			"    healthcheck:",
			'      test: ["CMD-SHELL", "pg_isready -U ${PG_USER} -d ${PG_DB}"]',
			"      interval: 5s",
			"      timeout: 3s",
			"      retries: 10",
			"    volumes:",
			"      - pgdata:/var/lib/postgresql",
			"    restart: unless-stopped",
			"",
			"  migrate:",
			"    build:",
			"      context: .",
			"      target: build",
			orm === "prisma"
				? `    command: pnpm --filter @${name}/prisma migrate:deploy`
				: `    command: pnpm --filter @${name}/drizzle migrate`,
			"    environment:",
			`      PG_URL: ${pgUrl}`,
			"    depends_on:",
			"      postgres:",
			"        condition: service_healthy",
			"",
		);
	}

	if (backend === "hono") {
		lines.push(
			"  api:",
			"    build:",
			"      context: .",
			"      target: api",
			"    env_file: .env",
			"    environment:",
			"      NODE_ENV: production",
		);
		if (orm !== "none") {
			lines.push(
				`      PG_URL: ${pgUrl}`,
				"    depends_on:",
				"      migrate:",
				"        condition: service_completed_successfully",
			);
		}
		if (frontend === "none") {
			lines.push("    ports:", '      - "${API_PORT:-4000}:4000"');
		}
		lines.push("    restart: unless-stopped", "");
	}

	if (frontend === "react") {
		lines.push(
			"  web:",
			"    build:",
			"      context: .",
			"      target: web",
			"    ports:",
			'      - "${WEB_PORT:-8080}:80"',
		);
		if (backend === "hono") lines.push("    depends_on:", "      - api");
		lines.push("    restart: unless-stopped", "");
	}

	if (orm !== "none") lines.push("volumes:", "  pgdata:", "");

	return lines.join("\n");
}
