import { Download } from 'lucide-react';
import { Button } from '@/shared/ui';
import { Breadcrumbs } from '@/shared/layout/Breadcrumbs';

export function ExportsPage() {
  return (
    <div className="flex-1 space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Breadcrumbs items={[{ label: 'Exports' }]} />
          <h1 className="text-2xl font-semibold text-gray-900">Exports</h1>
          <p className="text-sm text-gray-600">
            Export contacts to CSV files
          </p>
        </div>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          New Export
        </Button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
        <p className="text-gray-500">Exports list will appear here</p>
      </div>
    </div>
  );
}
