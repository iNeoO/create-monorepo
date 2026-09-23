import { VERSIONS } from "../versions.js";

/**
 * One multi-stage Dockerfile for the whole monorepo. `docker-compose.prod.yaml`
 * picks the `api` and `web` targets; the `build` stage doubles as the
 * migration runner because it still has the dev dependencies.
 */
export function buildDockerfile(
	name: string,
	backend: string,
	frontend: string,
	orm: string,
): string {
	const lines: string[] = [
		"FROM node:24-alpine AS base",
		"# Standalone install: pnpm then runs as the version pinned by `packageManager`",
		"# without rewriting the lockfile (npm/corepack installs add a",
		"# packageManagerDependencies document and break --frozen-lockfile).",
		"ENV PNPM_HOME=/pnpm",
		'ENV PATH="$PNPM_HOME/bin:$PATH"',
		`RUN wget -qO- https://get.pnpm.io/install.sh | ENV=/root/.shrc SHELL=sh PNPM_VERSION=${VERSIONS.pnpm} sh -`,
		"WORKDIR /app",
		"",
		"FROM base AS build",
		"COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./",
		"# `pnpm fetch` fills the store from the lockfile alone (cached layer) and",
		"# normalises the lockfile for this pnpm (packageManagerDependencies document).",
		"# Keep that copy: `COPY . .` brings the host version back, which pnpm 12",
		"# would refuse under --frozen-lockfile.",
		"RUN pnpm fetch && cp pnpm-lock.yaml /tmp/pnpm-lock.yaml",
		"COPY . .",
		"RUN cp /tmp/pnpm-lock.yaml pnpm-lock.yaml && pnpm install --frozen-lockfile --offline",
	];

	if (orm === "prisma")
		lines.push(`RUN pnpm --filter @${name}/prisma generate`);
	if (backend === "hono") {
		lines.push("RUN pnpm run dev:libs:build && pnpm run hono:build");
	}
	if (frontend === "react") lines.push("RUN pnpm run react:build");

	if (backend === "hono") {
		lines.push(
			"",
			"# Separate stage: `pnpm deploy --prod` switches the workspace node_modules",
			"# to production mode, which would break the `build` stage used for migrations.",
			"FROM build AS api-deploy",
			`RUN pnpm deploy --legacy --filter @${name}/hono --prod /prod/api`,
			"",
			"FROM node:24-alpine AS api",
			"ENV NODE_ENV=production",
			"WORKDIR /app",
			"COPY --from=api-deploy /prod/api ./",
			"USER node",
			"EXPOSE 4000",
			'CMD ["node", "dist/index.js"]',
		);
	}

	if (frontend === "react") {
		lines.push(
			"",
			"FROM nginx:alpine AS web",
			"COPY --from=build /app/apps/react/dist /usr/share/nginx/html",
			"COPY apps/react/nginx.conf /etc/nginx/conf.d/default.conf",
			"EXPOSE 80",
		);
	}

	lines.push("");
	return lines.join("\n");
}
