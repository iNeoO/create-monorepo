import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: HomePage });

function HomePage() {
	return (
		<div className="rounded-lg border border-gray-200 bg-white p-6">
			<h1 className="text-xl font-semibold text-gray-900">Hello</h1>
			<p className="mt-2 text-sm text-gray-600">
				React 19 · TanStack Router · TanStack Query · Tailwind v4
			</p>
		</div>
	);
}
