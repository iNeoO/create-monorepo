import { VERSIONS } from "../versions.js";

export function buildWorkspaceYaml(
	backend: string,
	frontend: string,
	orm: string,
): string {
	const pkgs = ["'packages/*'"];
	if (backend !== "none" || frontend !== "none") pkgs.push("'apps/*'");
	if (orm !== "none") pkgs.push('"db/*"');

	// pnpm 12 refuses to install when a dependency's build script is neither
	// allowed nor denied. esbuild comes with tsx (backend) and drizzle-kit.
	const allowBuilds: string[] = [];
	if (backend === "hono" || orm !== "none") allowBuilds.push("  esbuild: true");
	if (orm === "prisma") {
		allowBuilds.push(
			"  '@prisma/engines': true",
			"  prisma: true",
			"  protobufjs: true",
		);
	}

	const catalog: string[] = [
		`  '@biomejs/biome': ${VERSIONS["@biomejs/biome"]}`,
	];
	if (backend === "hono") {
		catalog.push(
			`  '@hono/node-server': ${VERSIONS["@hono/node-server"]}`,
			`  hono: '${VERSIONS.hono}'`,
			`  hono-openapi: "${VERSIONS["hono-openapi"]}"`,
		);
	}
	catalog.push(
		`  '@types/node': ${VERSIONS["@types/node"]}`,
		`  typescript: ${VERSIONS.typescript}`,
		`  tsx: "${VERSIONS.tsx}"`,
		`  vitest: ${VERSIONS.vitest}`,
		`  zod: ${VERSIONS.zod}`,
	);

	return [
		"packages:",
		...pkgs.map((p) => `  - ${p}`),
		"",
		"allowBuilds:",
		...allowBuilds,
		"",
		"catalog:",
		...catalog,
		"",
	].join("\n");
}
