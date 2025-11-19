// API Response Types
export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  request_id?: string;
}

// Filter Types
export interface FilterCondition {
  field: string;
  operator: 'eq' | 'ne' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'regex';
  value: unknown;
}

export interface FilterGroup {
  type: 'and' | 'or';
  conditions: (FilterCondition | FilterGroup)[];
}

export type FilterDefinition = FilterCondition | FilterGroup;

// Job Status
export type JobStatus = 'pending' | 'mapping' | 'processing' | 'complete' | 'failed' | 'canceled';

export interface JobProgress {
  stage: string;
  percent: number;
  eta_seconds?: number;
  processed?: number;
  total?: number;
}
