import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Users,
  List,
  Upload,
  Download,
  Tags,
  Layers,
  GitMerge,
  Settings,
  ChevronLeft,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/shared/ui';
import { useUiStore } from '@/store/uiStore';
import { ROUTES } from '@/constants/routes';
import { usePermissions } from '@/hooks';

const navigation = [
  { name: 'Dashboard', href: ROUTES.DASHBOARD, icon: Home },
  { name: 'Contacts', href: ROUTES.CONTACTS, icon: Users, permission: 'contacts_read' },
  { name: 'Lists', href: ROUTES.LISTS, icon: List, permission: 'contacts_read' },
  { name: 'Imports', href: ROUTES.IMPORTS, icon: Upload, permission: 'imports_create' },
  { name: 'Exports', href: ROUTES.EXPORTS, icon: Download, permission: 'exports_create' },
  { name: 'Tags', href: ROUTES.TAGS, icon: Tags, permission: 'tags_manage' },
  { name: 'Segments', href: ROUTES.SEGMENTS, icon: Layers, permission: 'segments_manage' },
  { name: 'Deduplicate', href: ROUTES.DEDUP, icon: GitMerge, permission: 'dedup_run' },
  { name: 'Audit Log', href: ROUTES.AUDIT, icon: FileText, permission: 'audit_view' },
];

export function Sidebar() {
  const location = useLocation();
  const { sidebarOpen, toggleSidebar } = useUiStore();
  const { hasPermission } = usePermissions();

  const visibleNav = navigation.filter(
    (item) => !item.permission || hasPermission(item.permission)
  );

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-gray-200 transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-20',
          'lg:relative lg:z-0'
        )}
      >
        {/* Logo & Toggle */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
          {sidebarOpen && (
            <span className="text-xl font-bold text-primary-600">MLM</span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="ml-auto"
          >
            {sidebarOpen ? (
              <ChevronLeft className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          {visibleNav.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100',
                  !sidebarOpen && 'justify-center'
                )}
                title={!sidebarOpen ? item.name : undefined}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {sidebarOpen && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Settings at bottom */}
        <div className="border-t border-gray-200 p-4">
          <Link
            to={ROUTES.SETTINGS}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors',
              !sidebarOpen && 'justify-center'
            )}
            title={!sidebarOpen ? 'Settings' : undefined}
          >
            <Settings className="h-5 w-5 shrink-0" />
            {sidebarOpen && <span>Settings</span>}
          </Link>
        </div>
      </div>
    </>
  );
}
