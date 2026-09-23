import { type ChildProcess, execSync, spawn } from "node:child_process";
import {
	copyFileSync,
	existsSync,
	mkdtempSync,
	readFileSync,
	rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import type { Answers } from "../src/questions.js";
import { scaffold } from "../src/scaffold.js";

type Variant = Omit<Answers, "projectName"> & { name: string };

const VARIANTS: Variant[] = [
	{
		name: "prisma",
		backend: "hono",
		frontend: "react",
		orm: "prisma",
		skills: ["create-hono-endpoint"],
	},
	{
		name: "drizzle",
		backend: "hono",
		frontend: "react",
		orm: "drizzle",
		skills: ["create-hono-endpoint"],
	},
	{
		name: "hono-react-no-db",
		backend: "hono",
		frontend: "react",
		orm: "none",
		skills: ["create-hono-endpoint"],
	},
	{
		name: "hono-only",
		backend: "hono",
		frontend: "none",
		orm: "none",
		skills: [],
	},
	{
		name: "react-only",
		backend: "none",
		frontend: "react",
		orm: "none",
		skills: [],
	},
];

const requested = process.env.E2E_VARIANT;
const variants = requested
	? VARIANTS.filter((v) => v.name === requested)
	: VARIANTS;
if (variants.length === 0)
	throw new Error(`Unknown E2E_VARIANT "${requested}"`);

const run = (cmd: string, cwd: string) =>
	execSync(cmd, { cwd, stdio: "inherit", env: process.env });

const readEnvFile = (path: string): Record<string, string> =>
	Object.fromEntries(
		readFileSync(path, "utf-8")
			.split("\n")
			.filter((line) => line.includes("="))
			.map((line) => line.split("=", 2) as [string, string]),
	);

const waitForHttp = async (url: string, attempts = 20) => {
	for (let i = 0; i < attempts; i++) {
		try {
			return await fetch(url);
		} catch {
			await new Promise((r) => setTimeout(r, 500));
		}
	}
	throw new Error(`Server did not answer on ${url}`);
};

const tmp = mkdtempSync(join(tmpdir(), "create-monorepo-e2e-"));
const servers: ChildProcess[] = [];

afterAll(() => {
	for (const s of servers) s.kill("SIGINT");
	rmSync(tmp, { recursive: true, force: true });
});

describe.each(variants)("scaffold $name", ({ name, ...answers }) => {
	const projectName = `app-${name}`;
	const app = join(tmp, projectName);
	const { backend, frontend, orm } = answers;

	it("generates a project that lints, builds and boots", async () => {
		await scaffold({ projectName, ...answers }, { cwd: tmp });
		const envExample = join(app, ".env.example");
		if (existsSync(envExample)) copyFileSync(envExample, join(app, ".env"));

		run("pnpm lint", app);

		if (backend === "hono") {
			run("pnpm common:build", app);
			run("pnpm infra:build", app);
			if (orm === "prisma") run("pnpm prisma:generate", app);
			if (orm !== "none") run(`pnpm ${orm}:build`, app);
			run("pnpm services:build", app);
			run("pnpm hono:build", app);
		}
		if (frontend === "react") run("pnpm react:build", app);
		if (backend !== "hono") return;

		const server = spawn("node", ["apps/hono/dist/index.js"], {
			cwd: app,
			env: { ...process.env, ...readEnvFile(join(app, ".env")) },
			stdio: "ignore",
		});
		servers.push(server);

		const spec = await waitForHttp("http://localhost:4000/api/openapi/spec");
		expect(spec.status).toBe(200);
		expect(await spec.json()).toMatchObject({ openapi: "3.1.0" });

		const missing = await fetch("http://localhost:4000/api/nope");
		expect(missing.status).toBe(404);
		expect(await missing.json()).toEqual({
			code: "NOT_FOUND",
			error: "Resource not found",
		});

		if (orm === "none") {
			const health = await fetch("http://localhost:4000/api/health");
			expect(health.status).toBe(200);
			expect(await health.json()).toEqual({ data: { status: "OK" } });
		}

		server.kill("SIGINT");
		await new Promise((resolve) => server.once("exit", resolve));
	});
});
