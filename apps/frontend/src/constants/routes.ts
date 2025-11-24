export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',

  // Contacts
  CONTACTS: '/contacts',
  CONTACT_DETAIL: '/contacts/:contactId',

  // Lists
  LISTS: '/lists',
  LIST_DETAIL: '/lists/:listId',

  // Imports
  IMPORTS: '/imports',
  IMPORT_DETAIL: '/imports/:importId',

  // Exports
  EXPORTS: '/exports',

  // Deduplication
  DEDUP: '/dedup',

  // Segments
  SEGMENTS: '/segments',
  SEGMENT_DETAIL: '/segments/:segmentId',

  // Tags
  TAGS: '/tags',

  // Settings
  SETTINGS: '/settings',
  SETTINGS_ORG: '/settings/org',
  SETTINGS_TEAM: '/settings/team',
  SETTINGS_BILLING: '/settings/billing',
  SETTINGS_PROFILE: '/settings/profile',

  // Audit
  AUDIT: '/audit',

  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',

  // Profile
  PROFILE: '/settings/profile',
} as const;

export function getContactDetailRoute(contactId: string): string {
  return `/contacts/${contactId}`;
}

export function getListDetailRoute(listId: string): string {
  return `/lists/${listId}`;
}

export function getImportDetailRoute(importId: string): string {
  return `/imports/${importId}`;
}

export function getSegmentDetailRoute(segmentId: string): string {
  return `/segments/${segmentId}`;
}
