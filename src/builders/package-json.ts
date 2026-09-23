import { VERSIONS } from "../versions.js";

export function buildRootPackageJson(
	name: string,
	backend: string,
	frontend: string,
	orm: string,
) {
	const scripts: Record<string, string> = {
		lint: "biome check .",
	};

	if (backend === "hono") {
		scripts["hono:dev"] = `dotenv -e .env -- pnpm --filter @${name}/hono dev`;
		scripts["hono:build"] = `pnpm --filter @${name}/hono build`;
		scripts["common:build"] = `pnpm --filter @${name}/common build`;
		scripts["infra:build"] = `pnpm --filter @${name}/infra build`;
		scripts["services:build"] = `pnpm --filter @${name}/services build`;
		const libsBuildParts = ["pnpm run common:build", "pnpm run infra:build"];
		if (orm !== "none") libsBuildParts.push(`pnpm run ${orm}:build`);
		libsBuildParts.push("pnpm run services:build");
		scripts["dev:libs:build"] = libsBuildParts.join(" && ");
	}

	if (frontend === "react") {
		scripts["react:dev"] = `dotenv -e .env -- pnpm --filter @${name}/react dev`;
		scripts["react:build"] = `pnpm --filter @${name}/react build`;
	}

	if (orm === "prisma") {
		scripts["prisma:generate"] =
			`dotenv -e .env -- pnpm --filter @${name}/prisma generate`;
		scripts["prisma:migrate"] =
			`dotenv -e .env -- pnpm --filter @${name}/prisma migrate`;
		scripts["prisma:deploy"] =
			`dotenv -e .env -- pnpm --filter @${name}/prisma deploy`;
		scripts["prisma:build"] = `pnpm --filter @${name}/prisma build`;
	}

	if (orm === "drizzle") {
		scripts["drizzle:generate"] =
			`dotenv -e .env -- pnpm --filter @${name}/drizzle generate`;
		scripts["drizzle:migrate"] =
			`dotenv -e .env -- pnpm --filter @${name}/drizzle migrate`;
		scripts["drizzle:push"] =
			`dotenv -e .env -- pnpm --filter @${name}/drizzle push`;
		scripts["drizzle:build"] = `pnpm --filter @${name}/drizzle build`;
	}

	const runtimeParts: string[] = [];
	if (backend === "hono") runtimeParts.push("pnpm run hono:dev");
	if (frontend === "react") runtimeParts.push("pnpm run react:dev");

	if (runtimeParts.length > 1) {
		scripts["dev:runtime"] = `concurrently -k "${runtimeParts.join('" "')}"`;
	} else if (runtimeParts.length === 1) {
		scripts["dev:runtime"] = runtimeParts[0];
	}

	const devParts: string[] = [];
	if (backend === "hono") {
		devParts.push("pnpm run dev:libs:build");
		devParts.push("pnpm run hono:build");
	}
	if (runtimeParts.length > 0) devParts.push("pnpm run dev:runtime");
	if (devParts.length > 0) scripts.dev = devParts.join(" && ");

	const devDeps: Record<string, string> = {
		"@biomejs/biome": "catalog:",
	};
	if (runtimeParts.length > 1) devDeps.concurrently = VERSIONS.concurrently;

	return {
		name,
		license: "MIT",
		scripts,
		type: "module",
		version: "1.0.0",
		packageManager: `pnpm@${VERSIONS.pnpm}`,
		dependencies: {
			"dotenv-cli": VERSIONS["dotenv-cli"],
		},
		devDependencies: devDeps,
	};
}
