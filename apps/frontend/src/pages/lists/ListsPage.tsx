import { Plus } from 'lucide-react';
import { Button } from '@/shared/ui';
import { Breadcrumbs } from '@/shared/layout/Breadcrumbs';
import { useLists } from '@/hooks';
import { LoadingSpinner } from '@/shared/feedback/LoadingSpinner';
import { EmptyState } from '@/shared/feedback/EmptyState';
import { List } from 'lucide-react';

export function ListsPage() {
  const { lists, isLoading } = useLists();

  return (
    <div className="flex-1 space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Breadcrumbs items={[{ label: 'Lists' }]} />
          <h1 className="text-2xl font-semibold text-gray-900">Lists</h1>
          <p className="text-sm text-gray-600">
            Organize contacts into lists
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create List
        </Button>
      </div>

      {isLoading ? (
        <LoadingSpinner className="py-12" />
      ) : lists.length === 0 ? (
        <EmptyState
          icon={List}
          title="No lists yet"
          description="Create your first list to organize your contacts"
          action={{ label: 'Create List', onClick: () => {} }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {lists.map((list) => (
            <div
              key={list.id}
              className="rounded-lg border border-gray-200 bg-white p-6"
            >
              <h3 className="font-medium text-gray-900">{list.name}</h3>
              {list.description && (
                <p className="mt-1 text-sm text-gray-500">{list.description}</p>
              )}
              <p className="mt-4 text-sm text-gray-600">
                {list.contact_count || 0} contacts
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
