import { defineConfig } from "vitest/config";

// Scaffolds real projects and builds them: slow, sequential, network-bound.
export default defineConfig({
	test: {
		include: ["test/**/*.e2e.test.ts"],
		fileParallelism: false,
		testTimeout: 15 * 60 * 1000,
		hookTimeout: 15 * 60 * 1000,
	},
});
