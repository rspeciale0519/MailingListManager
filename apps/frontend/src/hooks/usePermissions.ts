import { useAuthStore } from '@/store/authStore';
import { useOrgStore } from '@/store/orgStore';
import { PERMISSIONS } from '@/constants/permissions';

/**
 * Hook to check user permissions
 */
export function usePermissions() {
  const { user } = useAuthStore();
  const { currentOrg } = useOrgStore();

  /**
   * Check if user has a specific permission
   */
  const hasPermission = (permission: string): boolean => {
    if (!user || !currentOrg) return false;

    // Find user's membership in current org
    const membership = user.organization_memberships?.find(
      (m) => m.organization_id === currentOrg.id
    );

    if (!membership) return false;

    // Owners have all permissions
    if (membership.role === 'owner') return true;

    // Check specific permission
    return membership.permissions?.[permission] === true;
  };

  /**
   * Check if user has any of the given permissions
   */
  const hasAnyPermission = (...permissions: string[]): boolean => {
    return permissions.some((permission) => hasPermission(permission));
  };

  /**
   * Check if user has all of the given permissions
   */
  const hasAllPermissions = (...permissions: string[]): boolean => {
    return permissions.every((permission) => hasPermission(permission));
  };

  /**
   * Check if user is owner of current org
   */
  const isOwner = (): boolean => {
    if (!user || !currentOrg) return false;

    const membership = user.organization_memberships?.find(
      (m) => m.organization_id === currentOrg.id
    );

    return membership?.role === 'owner';
  };

  /**
   * Get user's role in current org
   */
  const getUserRole = (): string | null => {
    if (!user || !currentOrg) return null;

    const membership = user.organization_memberships?.find(
      (m) => m.organization_id === currentOrg.id
    );

    return membership?.role || null;
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isOwner,
    getUserRole,
    // Convenience methods for common permissions
    canReadContacts: hasPermission(PERMISSIONS.CONTACTS_READ),
    canUpdateContacts: hasPermission(PERMISSIONS.CONTACTS_UPDATE),
    canDeleteContacts: hasPermission(PERMISSIONS.CONTACTS_DELETE),
    canBulkEdit: hasPermission(PERMISSIONS.CONTACTS_BULK_EDIT),
    canImport: hasPermission(PERMISSIONS.IMPORTS_CREATE),
    canExport: hasPermission(PERMISSIONS.EXPORTS_CREATE),
    canManageTags: hasPermission(PERMISSIONS.TAGS_MANAGE),
    canRunDedup: hasPermission(PERMISSIONS.DEDUP_RUN),
    canManageSegments: hasPermission(PERMISSIONS.SEGMENTS_MANAGE),
    canViewAudit: hasPermission(PERMISSIONS.AUDIT_VIEW),
    canManageSchema: hasPermission(PERMISSIONS.SCHEMA_MANAGE),
  };
}
