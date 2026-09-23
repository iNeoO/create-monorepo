import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { client } from "../libs/hc";

export const Route = createFileRoute("/")({ component: HomePage });

async function fetchHealth() {
	const res = await client.health.$get();
	if (!res.ok) throw new Error(`Health check failed (${res.status})`);
	return res.json();
}

function HomePage() {
	const { data, isLoading, isError } = useQuery({
		queryKey: ["health"],
		queryFn: fetchHealth,
	});

	return (
		<div className="rounded-lg border border-gray-200 bg-white p-6">
			<h1 className="text-xl font-semibold text-gray-900">API status</h1>
			<p className="mt-2 text-sm text-gray-600">
				{isLoading && "Checking…"}
				{isError && "API unreachable"}
				{data && `API: ${data.data.status}`}
			</p>
		</div>
	);
}
