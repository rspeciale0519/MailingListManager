import { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
} from '@tanstack/react-table';
import { useContacts } from '@/hooks/useContacts';
import { Checkbox } from '@/shared/ui/checkbox';
import { Button } from '@/shared/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { ArrowUp, ArrowDown, MoreVertical, Eye, Edit, Trash } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { ContactsTableFilters } from './ContactsTableFilters';
import { BulkActionsToolbar } from './BulkActionsToolbar';
import { TagPillEditor } from './TagPillEditor';
import type { Contact, ContactFilters } from '@/types';

interface ContactsTableProps {
  listId?: string;
  onContactClick?: (contact: Contact) => void;
  onContactEdit?: (contact: Contact) => void;
  onContactDelete?: (contact: Contact) => void;
}

export function ContactsTable({
  listId,
  onContactClick,
  onContactEdit,
  onContactDelete,
}: ContactsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [filters, setFilters] = useState<ContactFilters>({
    list_id: listId,
    page: 1,
    limit: 50,
  });

  const { contacts, meta, isLoading, refetch } = useContacts(filters);

  // Column definitions
  const columns = useMemo<ColumnDef<Contact>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        size: 40,
      },
      {
        accessorKey: 'email',
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          return (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => column.toggleSorting()}
              className="h-8 px-2"
            >
              Email
              {isSorted === 'asc' ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : isSorted === 'desc' ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : null}
            </Button>
          );
        },
        cell: ({ getValue }) => {
          const email = getValue() as string | undefined;
          return (
            <div className="max-w-[200px] truncate font-medium">
              {email || <span className="text-gray-400">—</span>}
            </div>
          );
        },
        enableSorting: true,
      },
      {
        accessorKey: 'first_name',
        header: 'First Name',
        cell: ({ getValue }) => {
          const name = getValue() as string | undefined;
          return (
            <div className="max-w-[150px] truncate">
              {name || <span className="text-gray-400">—</span>}
            </div>
          );
        },
      },
      {
        accessorKey: 'last_name',
        header: 'Last Name',
        cell: ({ getValue }) => {
          const name = getValue() as string | undefined;
          return (
            <div className="max-w-[150px] truncate">
              {name || <span className="text-gray-400">—</span>}
            </div>
          );
        },
      },
      {
        accessorKey: 'phone',
        header: 'Phone',
        cell: ({ getValue }) => {
          const phone = getValue() as string | undefined;
          return (
            <div className="max-w-[120px] truncate">
              {phone || <span className="text-gray-400">—</span>}
            </div>
          );
        },
      },
      {
        accessorKey: 'company',
        header: 'Company',
        cell: ({ getValue }) => {
          const company = getValue() as string | undefined;
          return (
            <div className="max-w-[150px] truncate">
              {company || <span className="text-gray-400">—</span>}
            </div>
          );
        },
      },
      {
        accessorKey: 'city',
        header: 'City',
        cell: ({ getValue }) => {
          const city = getValue() as string | undefined;
          return (
            <div className="max-w-[120px] truncate">
              {city || <span className="text-gray-400">—</span>}
            </div>
          );
        },
      },
      {
        accessorKey: 'state',
        header: 'State',
        cell: ({ getValue }) => {
          const state = getValue() as string | undefined;
          return state || <span className="text-gray-400">—</span>;
        },
        size: 60,
      },
      {
        accessorKey: 'tags',
        header: 'Tags',
        cell: ({ row }) => <TagPillEditor contact={row.original} />,
        enableSorting: false,
        size: 200,
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onContactClick?.(row.original)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onContactEdit?.(row.original)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onContactDelete?.(row.original)}
                className="text-red-600"
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        enableSorting: false,
        size: 60,
      },
    ],
    [onContactClick, onContactEdit, onContactDelete]
  );

  const table = useReactTable({
    data: contacts,
    columns,
    state: {
      sorting,
      rowSelection,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
    pageCount: meta ? Math.ceil(meta.total / meta.limit) : 0,
  });

  const selectedRowIds = Object.keys(rowSelection);
  const selectedContacts = selectedRowIds.map((id) => contacts[parseInt(id)]);

  const handleFilterChange = (newFilters: Partial<ContactFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  return (
    <div className="space-y-4">
      <ContactsTableFilters filters={filters} onFilterChange={handleFilterChange} />

      {selectedContacts.length > 0 && (
        <BulkActionsToolbar
          selectedContacts={selectedContacts}
          onClearSelection={() => setRowSelection({})}
          onActionComplete={() => {
            setRowSelection({});
            refetch();
          }}
        />
      )}

      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} style={{ width: header.getSize() }}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    Loading contacts...
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    className="cursor-pointer hover:bg-gray-50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No contacts found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {(meta.page - 1) * meta.limit + 1} to{' '}
            {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} contacts
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(meta.page - 1)}
              disabled={meta.page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(meta.page + 1)}
              disabled={!meta.hasMore}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
