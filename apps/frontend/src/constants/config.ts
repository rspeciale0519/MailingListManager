export const CONFIG = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/v1',
  WS_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:8000',
  ENV: import.meta.env.VITE_ENV || 'development',

  // Pagination defaults
  DEFAULT_PAGE_SIZE: 50,
  PAGE_SIZE_OPTIONS: [25, 50, 100, 250],

  // Debounce times
  SEARCH_DEBOUNCE_MS: 300,
  FILTER_DEBOUNCE_MS: 500,

  // File upload
  MAX_FILE_SIZE_FREE: 5 * 1024 * 1024, // 5MB
  MAX_FILE_SIZE_STARTER: 50 * 1024 * 1024, // 50MB
  MAX_FILE_SIZE_PRO: 500 * 1024 * 1024, // 500MB
  MAX_FILE_SIZE_ENTERPRISE: 2 * 1024 * 1024 * 1024, // 2GB

  // Cache TTL
  QUERY_CACHE_TIME: 5 * 60 * 1000, // 5 minutes
  QUERY_STALE_TIME: 1 * 60 * 1000, // 1 minute

  // Colors
  TAG_COLORS: [
    '#EF4444', // red
    '#F59E0B', // amber
    '#10B981', // green
    '#3B82F6', // blue
    '#6366F1', // indigo
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#06B6D4', // cyan
  ],
} as const;
