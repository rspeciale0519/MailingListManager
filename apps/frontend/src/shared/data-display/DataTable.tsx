import {
  flexRender,
  Table as TanStackTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui';
import { LoadingSpinner } from '@/shared/feedback/LoadingSpinner';
import { EmptyState } from '@/shared/feedback/EmptyState';
import { Database } from 'lucide-react';

interface DataTableProps<TData> {
  table: TanStackTable<TData>;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onEmptyAction?: () => void;
  emptyActionLabel?: string;
}

export function DataTable<TData>({
  table,
  isLoading,
  emptyTitle = 'No data',
  emptyDescription = 'No data to display',
  onEmptyAction,
  emptyActionLabel = 'Add item',
}: DataTableProps<TData>) {
  const rows = table.getRowModel().rows;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner text="Loading..." />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Database}
        title={emptyTitle}
        description={emptyDescription}
        action={
          onEmptyAction
            ? { label: emptyActionLabel, onClick: onEmptyAction }
            : undefined
        }
      />
    );
  }

  return (
    <div className="rounded-md border border-gray-200">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} style={{ width: header.getSize() }}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.id}
              data-state={row.getIsSelected() && 'selected'}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
