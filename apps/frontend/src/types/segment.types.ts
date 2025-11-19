import type { FilterDefinition } from './api.types';

export interface Segment {
  id: string;
  name: string;
  description?: string;
  color?: string;
  filter_definition: FilterDefinition;
  auto_update: boolean;
  cached_count?: number;
  cached_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSegmentInput {
  name: string;
  description?: string;
  filter_definition: FilterDefinition;
  auto_update?: boolean;
}

export interface UpdateSegmentInput {
  name?: string;
  description?: string;
  filter_definition?: FilterDefinition;
  auto_update?: boolean;
}
