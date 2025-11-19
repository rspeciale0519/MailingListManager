export const PERMISSIONS = {
  // Imports
  IMPORTS_CREATE: 'imports_create',

  // Contacts
  CONTACTS_READ: 'contacts_read',
  CONTACTS_UPDATE: 'contacts_update',
  CONTACTS_DELETE: 'contacts_delete',
  CONTACTS_BULK_EDIT: 'contacts_bulk_edit',

  // Tags
  TAGS_MANAGE: 'tags_manage',

  // Dedup
  DEDUP_RUN: 'dedup_run',

  // Exports
  EXPORTS_CREATE: 'exports_create',

  // Segments
  SEGMENTS_MANAGE: 'segments_manage',

  // Audit
  AUDIT_VIEW: 'audit_view',

  // Schema
  SCHEMA_MANAGE: 'schema_manage',
} as const;

export const PERMISSION_PRESETS = {
  VIEWER: {
    name: 'Viewer',
    description: 'Read-only access',
    permissions: {
      [PERMISSIONS.CONTACTS_READ]: true,
      [PERMISSIONS.AUDIT_VIEW]: false,
    },
  },
  EDITOR: {
    name: 'Editor',
    description: 'Edit contacts and tags',
    permissions: {
      [PERMISSIONS.CONTACTS_READ]: true,
      [PERMISSIONS.CONTACTS_UPDATE]: true,
      [PERMISSIONS.TAGS_MANAGE]: true,
    },
  },
  IMPORTER: {
    name: 'Importer',
    description: 'Can import and map data',
    permissions: {
      [PERMISSIONS.CONTACTS_READ]: true,
      [PERMISSIONS.IMPORTS_CREATE]: true,
      [PERMISSIONS.CONTACTS_UPDATE]: true,
    },
  },
  EXPORTER: {
    name: 'Exporter',
    description: 'Can export data',
    permissions: {
      [PERMISSIONS.CONTACTS_READ]: true,
      [PERMISSIONS.EXPORTS_CREATE]: true,
    },
  },
  MANAGER: {
    name: 'Manager',
    description: 'Full access except billing',
    permissions: {
      [PERMISSIONS.CONTACTS_READ]: true,
      [PERMISSIONS.CONTACTS_UPDATE]: true,
      [PERMISSIONS.CONTACTS_DELETE]: true,
      [PERMISSIONS.CONTACTS_BULK_EDIT]: true,
      [PERMISSIONS.IMPORTS_CREATE]: true,
      [PERMISSIONS.EXPORTS_CREATE]: true,
      [PERMISSIONS.TAGS_MANAGE]: true,
      [PERMISSIONS.DEDUP_RUN]: true,
      [PERMISSIONS.SEGMENTS_MANAGE]: true,
      [PERMISSIONS.AUDIT_VIEW]: true,
      [PERMISSIONS.SCHEMA_MANAGE]: true,
    },
  },
} as const;
