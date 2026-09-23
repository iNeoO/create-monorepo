import { describe, expect, it } from "vitest";
import { VERSIONS } from "../versions.js";
import { buildProdCompose } from "./docker-compose.js";
import { buildDockerfile } from "./dockerfile.js";
import { buildRootPackageJson } from "./package-json.js";
import { buildWorkspaceYaml } from "./pnpm-workspace.js";
import { buildReadme } from "./readme.js";

describe("buildRootPackageJson", () => {
	it("wires the full stack: libs build, both dev servers, pinned pnpm", () => {
		const pkg = buildRootPackageJson("app", "hono", "react", "prisma");

		expect(pkg.packageManager).toBe(`pnpm@${VERSIONS.pnpm}`);
		expect(pkg.scripts.lint).toBe("biome check .");
		expect(pkg.scripts["dev:libs:build"]).toBe(
			"pnpm run common:build && pnpm run infra:build && pnpm run prisma:build && pnpm run services:build",
		);
		expect(pkg.scripts["dev:runtime"]).toBe(
			'concurrently -k "pnpm run hono:dev" "pnpm run react:dev"',
		);
		expect(pkg.scripts.dev).toBe(
			"pnpm run dev:libs:build && pnpm run hono:build && pnpm run dev:runtime",
		);
		expect(pkg.devDependencies).toEqual({
			"@biomejs/biome": "catalog:",
			concurrently: VERSIONS.concurrently,
		});
	});

	it("does not pull concurrently for a single runtime", () => {
		const pkg = buildRootPackageJson("app", "hono", "none", "drizzle");

		expect(pkg.scripts["dev:runtime"]).toBe("pnpm run hono:dev");
		expect(pkg.devDependencies).not.toHaveProperty("concurrently");
		expect(pkg.scripts["drizzle:push"]).toContain("--filter @app/drizzle push");
		expect(pkg.scripts).not.toHaveProperty("prisma:generate");
	});

	it("backend without ORM still builds the services package", () => {
		const pkg = buildRootPackageJson("app", "hono", "none", "none");

		expect(pkg.scripts["dev:libs:build"]).toBe(
			"pnpm run common:build && pnpm run infra:build && pnpm run services:build",
		);
	});

	it("frontend only: no libs build step", () => {
		const pkg = buildRootPackageJson("app", "none", "react", "none");

		expect(pkg.scripts.dev).toBe("pnpm run dev:runtime");
		expect(pkg.scripts).not.toHaveProperty("dev:libs:build");
		expect(pkg.scripts).not.toHaveProperty("hono:dev");
	});
});

describe("buildWorkspaceYaml", () => {
	it("lists db/* and prisma build approvals only with prisma", () => {
		const yaml = buildWorkspaceYaml("hono", "react", "prisma");

		expect(yaml).toContain('- "db/*"');
		expect(yaml).toContain("'@prisma/engines': true");
		expect(yaml).toContain(`hono: '${VERSIONS.hono}'`);
	});

	it("keeps the catalog free of hono without a backend", () => {
		const yaml = buildWorkspaceYaml("none", "react", "none");

		expect(yaml).not.toContain("db/*");
		expect(yaml).not.toContain("hono");
		expect(yaml).not.toContain("esbuild");
		expect(yaml).toContain(`typescript: ${VERSIONS.typescript}`);
	});

	it("allows esbuild (tsx) for a backend without ORM", () => {
		const yaml = buildWorkspaceYaml("hono", "none", "none");

		expect(yaml).toContain("esbuild: true");
		expect(yaml).not.toContain("prisma");
	});
});

describe("buildReadme", () => {
	it("documents only the selected bricks", () => {
		const readme = buildReadme("app", "hono", "none", "drizzle");

		expect(readme).toContain("# app");
		expect(readme).toContain("pnpm drizzle:push");
		expect(readme).not.toContain("prisma");
		expect(readme).not.toContain("react/");
	});
});

describe("buildDockerfile", () => {
	it("full stack: generate, build libs, prune the api, serve the web", () => {
		const dockerfile = buildDockerfile("app", "hono", "react", "prisma");

		expect(dockerfile).toContain(`PNPM_VERSION=${VERSIONS.pnpm} sh -`);
		expect(dockerfile).toContain("RUN pnpm --filter @app/prisma generate");
		expect(dockerfile).toContain(
			"RUN pnpm deploy --legacy --filter @app/hono --prod /prod/api",
		);
		expect(dockerfile).toContain("FROM node:24-alpine AS api");
		expect(dockerfile).toContain("FROM nginx:alpine AS web");
	});

	it("frontend only: no api stage, no prisma", () => {
		const dockerfile = buildDockerfile("app", "none", "react", "none");

		expect(dockerfile).not.toContain("AS api");
		expect(dockerfile).not.toContain("prisma");
		expect(dockerfile).toContain("RUN pnpm run react:build");
	});
});

describe("buildProdCompose", () => {
	it("chains postgres, migrate and api, exposes only the web", () => {
		const compose = buildProdCompose("app", "hono", "react", "drizzle");

		expect(compose).toContain("command: pnpm --filter @app/drizzle migrate");
		expect(compose).toContain("condition: service_completed_successfully");
		expect(compose).toContain('- "${WEB_PORT:-8080}:80"');
		expect(compose).not.toContain("API_PORT");
	});

	it("api without database or frontend is published directly", () => {
		const compose = buildProdCompose("app", "hono", "none", "none");

		expect(compose).not.toContain("postgres");
		expect(compose).not.toContain("migrate");
		expect(compose).toContain('- "${API_PORT:-4000}:4000"');
	});
});
