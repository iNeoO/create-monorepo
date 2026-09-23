export const VERSIONS = {
	pnpm: "12.5.1",
	// root deps
	"dotenv-cli": "^11.0.0",
	concurrently: "^10.0.5",
	// catalog
	"@biomejs/biome": "^2.5.14",
	"@hono/node-server": "^2.1.1",
	hono: "^4.13.8",
	"hono-openapi": "^1.3.3",
	"@types/node": "^26.6.2",
	typescript: "^7.0.2",
	tsx: "^4.23.15",
	vitest: "^5.0.1",
	zod: "^4.6.5",
	// hono backend
	"@hono/standard-validator": "^0.4.0",
	"@hono/zod-validator": "^0.9.1",
	"@scalar/hono-api-reference": "^0.12.4",
	// infra
	"openapi-types": "^12.1.3",
	pino: "^10.3.1",
	"pino-pretty": "^13.1.3",
	// prisma
	"@prisma/adapter-pg": "7.10.0",
	"@prisma/client": "7.10.0",
	pg: "^8.23.0",
	"@types/pg": "^8.23.1",
	prisma: "7.10.0",
	// drizzle (1.0 still on the rc channel — rc.4 is the latest tagged rc)
	"drizzle-orm": "1.0.0-rc.4",
	"drizzle-kit": "1.0.0-rc.4",
	// react
	"@tanstack/react-query": "^5.103.2",
	"@tanstack/react-router": "^1.170.38",
	"@tanstack/react-table": "^9.2.4",
	react: "^19.3.0",
	"react-dom": "^19.3.0",
	"@babel/core": "^8.0.6",
	"@rolldown/plugin-babel": "^0.2.4",
	"@tailwindcss/vite": "^4.3.3",
	"@tanstack/router-plugin": "^1.168.40",
	"@types/react": "^19.3.0",
	"@types/react-dom": "^19.3.0",
	"@vitejs/plugin-react": "^6.1.1",
	"babel-plugin-react-compiler": "^1.0.0",
	tailwindcss: "^4.3.3",
	vite: "^8.3.0",
} as const;
