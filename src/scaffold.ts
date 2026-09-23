import { execSync } from "node:child_process";
import {
	cpSync,
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildRootPackageJson } from "./builders/package-json.js";
import { buildWorkspaceYaml } from "./builders/pnpm-workspace.js";
import { buildReadme } from "./builders/readme.js";
import type { Answers } from "./questions.js";
import { VERSIONS } from "./versions.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES = resolve(__dirname, "../templates");

const SKIP = new Set([
	"dist",
	"node_modules",
	"generated",
	".git",
	"routeTree.gen.ts",
]);

function writeJson(path: string, value: unknown) {
	writeFileSync(path, `${JSON.stringify(value, null, "\t")}\n`);
}

function copyDir(src: string, dest: string) {
	cpSync(src, dest, {
		recursive: true,
		filter: (srcPath: string) => !SKIP.has(basename(srcPath)),
	});
}

function replaceVersions(dir: string) {
	for (const [pkg, version] of Object.entries(VERSIONS)) {
		replaceInDir(dir, `__${pkg}__`, version);
	}
}

function replaceInDir(dir: string, from: string, to: string) {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) {
			if (!SKIP.has(entry.name)) replaceInDir(full, from, to);
		} else {
			try {
				const content = readFileSync(full, "utf-8");
				if (content.includes(from))
					writeFileSync(full, content.replaceAll(from, to));
			} catch {
				// skip binary files that can't be read as utf-8
			}
		}
	}
}

function dropSection(content: string, marker: string): string {
	return content.replace(
		new RegExp(`<!--${marker}_START-->[\\s\\S]*?<!--${marker}_END-->\\n?`, "g"),
		"",
	);
}

function keepSection(content: string, marker: string): string {
	return content
		.replace(new RegExp(`<!--${marker}_START-->\\n?`, "g"), "")
		.replace(new RegExp(`<!--${marker}_END-->\\n?`, "g"), "");
}

function filterOrmSections(content: string, orm: string): string {
	let out = content;
	for (const marker of ["PRISMA", "DRIZZLE"]) {
		out =
			marker.toLowerCase() === orm
				? keepSection(out, marker)
				: dropSection(out, marker);
	}
	return out;
}

function applyOrmFilterToDir(dir: string, orm: string) {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) {
			applyOrmFilterToDir(full, orm);
		} else if (entry.name.endsWith(".md")) {
			const content = readFileSync(full, "utf-8");
			if (
				content.includes("<!--PRISMA_START-->") ||
				content.includes("<!--DRIZZLE_START-->")
			) {
				writeFileSync(full, filterOrmSections(content, orm));
			}
		}
	}
}

function patchHonoForDrizzle(honoDir: string) {
	const pkgPath = join(honoDir, "package.json");
	const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
	delete pkg.dependencies["@monorepo-template/prisma"];
	pkg.dependencies["@monorepo-template/drizzle"] = "workspace:*";
	writeJson(pkgPath, pkg);

	writeFileSync(
		join(honoDir, "src/services/container.ts"),
		`import { type Database, db } from "@monorepo-template/drizzle";
import {
	HealthService,
	PostsService,
	UsersService,
} from "@monorepo-template/services";

export type AppServices = {
	db: Database;
	health: HealthService;
	posts: PostsService;
	users: UsersService;
};

export const createServices = (): AppServices => {
	return {
		db,
		health: new HealthService(db),
		posts: new PostsService(db),
		users: new UsersService(db),
	};
};

export const services = createServices();
`,
	);

	const indexPath = join(honoDir, "src/index.ts");
	const index = readFileSync(indexPath, "utf-8");
	writeFileSync(
		indexPath,
		index.replace(
			"await services.db.$disconnect();",
			"await services.db.$client.end();",
		),
	);
}

/** Backend without a database: health only, no env for PostgreSQL. */
function patchHonoForNoOrm(dest: string) {
	const honoDir = join(dest, "apps/hono");
	const variant = join(TEMPLATES, "variants/hono-no-orm");

	const pkgPath = join(honoDir, "package.json");
	const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
	delete pkg.dependencies["@monorepo-template/prisma"];
	writeJson(pkgPath, pkg);

	rmSync(join(honoDir, "src/modules/posts"), { recursive: true });
	rmSync(join(honoDir, "src/modules/users"), { recursive: true });
	cpSync(
		join(variant, "container.ts"),
		join(honoDir, "src/services/container.ts"),
	);
	cpSync(
		join(variant, "health.schema.ts"),
		join(honoDir, "src/modules/health/health.schema.ts"),
	);
	cpSync(
		join(variant, "env.ts"),
		join(dest, "packages/infra/src/configs/env.ts"),
	);

	dropLines(join(honoDir, "src/app.ts"), [
		"PostsController",
		"UsersController",
	]);
	dropLines(join(honoDir, "src/index.ts"), ["services.db.$disconnect()"]);

	rmSync(join(dest, "docker-compose.yaml"));
	writeFileSync(
		join(dest, ".env.example"),
		"FRONTEND_URL=http://localhost:5173\n",
	);
}

/** Frontend without posts/users data: a single page, optionally polling the API health. */
function stripFrontendData(dest: string, backend: string) {
	const reactDir = join(dest, "apps/react");
	const variant = join(TEMPLATES, "variants/react-no-data");

	for (const path of [
		"src/routes/users.tsx",
		"src/hooks",
		"src/libs/api",
		"src/libs/apiError.ts",
		"src/components/DataTable.tsx",
		"src/components/Modal.tsx",
	]) {
		rmSync(join(reactDir, path), { recursive: true, force: true });
	}
	cpSync(
		join(variant, "routes/__root.tsx"),
		join(reactDir, "src/routes/__root.tsx"),
	);
	cpSync(
		join(
			variant,
			backend === "hono"
				? "routes/index.health.tsx"
				: "routes/index.static.tsx",
		),
		join(reactDir, "src/routes/index.tsx"),
	);

	const pkgPath = join(reactDir, "package.json");
	const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
	delete pkg.dependencies["@tanstack/react-table"];
	if (backend === "none") {
		delete pkg.dependencies["@monorepo-template/hono"];
		delete pkg.dependencies.hono;
		rmSync(join(reactDir, "src/libs/hc.ts"));
		// No API to proxy to.
		cpSync(join(variant, "vite.config.ts"), join(reactDir, "vite.config.ts"));
	}
	writeJson(pkgPath, pkg);
}

function dropLines(path: string, needles: string[]) {
	const lines = readFileSync(path, "utf-8").split("\n");
	const kept = lines.filter((line) => !needles.some((n) => line.includes(n)));
	writeFileSync(path, kept.join("\n"));
}

export type ScaffoldOptions = {
	/** Directory the project is created in. Defaults to the current directory. */
	cwd?: string;
};

export async function scaffold(
	answers: Answers,
	{ cwd = process.cwd() }: ScaffoldOptions = {},
) {
	const { projectName, backend, frontend, orm, skills } = answers;
	const dest = resolve(cwd, projectName);

	if (existsSync(dest)) {
		throw new Error(`Directory "${projectName}" already exists.`);
	}

	console.log(`\nScaffolding ${projectName}...`);
	mkdirSync(dest, { recursive: true });

	copyDir(join(TEMPLATES, "base"), dest);

	copyDir(join(TEMPLATES, "packages/common"), join(dest, "packages/common"));

	if (backend === "hono") {
		copyDir(join(TEMPLATES, "backend/hono"), join(dest, "apps/hono"));
		copyDir(
			join(TEMPLATES, "packages/infra-hono"),
			join(dest, "packages/infra"),
		);
		if (orm === "prisma") {
			copyDir(
				join(TEMPLATES, "packages/services-prisma"),
				join(dest, "packages/services"),
			);
		} else if (orm === "drizzle") {
			copyDir(
				join(TEMPLATES, "packages/services-drizzle"),
				join(dest, "packages/services"),
			);
			patchHonoForDrizzle(join(dest, "apps/hono"));
		} else {
			copyDir(
				join(TEMPLATES, "packages/services-none"),
				join(dest, "packages/services"),
			);
			patchHonoForNoOrm(dest);
		}
	}

	if (frontend === "react") {
		copyDir(join(TEMPLATES, "frontend/react"), join(dest, "apps/react"));
		if (orm === "none") stripFrontendData(dest, backend);
	}

	if (backend === "none") {
		rmSync(join(dest, "docker-compose.yaml"));
		rmSync(join(dest, ".env.example"));
	}

	if (orm === "prisma") {
		copyDir(join(TEMPLATES, "orm/prisma"), join(dest, "db/prisma"));
	}

	if (orm === "drizzle") {
		copyDir(join(TEMPLATES, "orm/drizzle"), join(dest, "db/drizzle"));
	}

	for (const skill of skills) {
		const skillDest = join(dest, ".claude", "skills", skill);
		mkdirSync(skillDest, { recursive: true });
		copyDir(join(TEMPLATES, "skills", skill), skillDest);
		applyOrmFilterToDir(skillDest, orm);
	}

	writeJson(
		join(dest, "package.json"),
		buildRootPackageJson(projectName, backend, frontend, orm),
	);
	writeFileSync(
		join(dest, "pnpm-workspace.yaml"),
		buildWorkspaceYaml(backend, frontend, orm),
	);
	writeFileSync(
		join(dest, "README.md"),
		buildReadme(projectName, backend, frontend, orm),
	);

	replaceVersions(dest);
	replaceInDir(dest, "monorepo-template", projectName);

	console.log("Installing dependencies (this may take a moment)...");
	execSync("pnpm install", { cwd: dest, stdio: "inherit" });

	try {
		execSync("pnpm exec biome check --write .", {
			cwd: dest,
			stdio: "inherit",
		});
	} catch {
		console.warn(
			"Biome reported issues in the generated project. Run `pnpm lint` to see them.",
		);
	}

	console.log(`\n✔ Done!\n`);
	console.log(`  cd ${projectName}`);
	if (backend === "hono")
		console.log(`  cp .env.example .env  # fill in your values`);
	if (orm === "prisma") {
		console.log(`  docker compose up -d`);
		console.log(`  pnpm common:build && pnpm infra:build`);
		console.log(`  pnpm prisma:migrate`);
		console.log(`  pnpm prisma:generate`);
	}
	if (orm === "drizzle") {
		console.log(`  docker compose up -d`);
		console.log(`  pnpm common:build && pnpm infra:build`);
		console.log(`  pnpm drizzle:generate`);
		console.log(`  pnpm drizzle:push`);
	}
	console.log(`  pnpm dev\n`);
}
