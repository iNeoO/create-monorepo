import {
	type ColumnDef,
	flexRender,
	type RowData,
	tableFeatures,
	useTable,
} from "@tanstack/react-table";

// Declare the table features once: v9 tree-shakes everything not listed here.
// Add e.g. `rowSortingFeature` when sorting is needed.
const features = tableFeatures({});

export type Columns<T extends RowData> = ColumnDef<typeof features, T>[];

interface DataTableProps<T extends RowData> {
	data: T[];
	columns: Columns<T>;
}

export function DataTable<T extends RowData>({
	data,
	columns,
}: DataTableProps<T>) {
	const table = useTable({
		features,
		data,
		columns,
	});

	return (
		<div className="overflow-x-auto rounded-lg border border-gray-200">
			<table className="min-w-full divide-y divide-gray-200">
				<thead className="bg-gray-50">
					{table.getHeaderGroups().map((headerGroup) => (
						<tr key={headerGroup.id}>
							{headerGroup.headers.map((header) => (
								<th
									key={header.id}
									className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
								>
									{header.isPlaceholder
										? null
										: flexRender(
												header.column.columnDef.header,
												header.getContext(),
											)}
								</th>
							))}
						</tr>
					))}
				</thead>
				<tbody className="bg-white divide-y divide-gray-200">
					{table.getRowModel().rows.map((row) => (
						<tr key={row.id} className="hover:bg-gray-50">
							{row.getAllCells().map((cell) => (
								<td key={cell.id} className="px-4 py-3 text-sm text-gray-900">
									{flexRender(cell.column.columnDef.cell, cell.getContext())}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
			{data.length === 0 && (
				<div className="text-center py-8 text-gray-500 text-sm">
					Aucune donnée
				</div>
			)}
		</div>
	);
}
