import { Users, List, Upload, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui';
import { useContacts, useLists, useImports, useExports } from '@/hooks';

export function DashboardPage() {
  const { contacts, isLoading: contactsLoading } = useContacts();
  const { lists, isLoading: listsLoading } = useLists();
  const { imports, isLoading: importsLoading } = useImports();
  const { exports, isLoading: exportsLoading } = useExports();

  const stats = [
    {
      name: 'Total Contacts',
      value: contacts?.length || 0,
      icon: Users,
      loading: contactsLoading,
    },
    {
      name: 'Lists',
      value: lists?.length || 0,
      icon: List,
      loading: listsLoading,
    },
    {
      name: 'Recent Imports',
      value: imports?.length || 0,
      icon: Upload,
      loading: importsLoading,
    },
    {
      name: 'Recent Exports',
      value: exports?.length || 0,
      icon: Download,
      loading: exportsLoading,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-600 mt-1">
          Overview of your mailing list management
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.name}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stat.loading ? '-' : stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Recent imports, exports, and contact changes will appear here.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Quick action shortcuts will appear here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
