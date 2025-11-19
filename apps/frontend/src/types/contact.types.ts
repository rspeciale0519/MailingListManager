export interface Contact {
  id: string;
  email?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  company?: string;
  title?: string;
  department?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  tags: string[];
  custom_fields: Record<string, unknown>;
  status: 'active' | 'inactive' | 'bounced' | 'unsubscribed' | 'deleted';
  created_at: string;
  updated_at: string;
}

export interface ContactFilters {
  list_id?: string;
  page?: number;
  limit?: number;
  search?: string;
  filter?: FilterDefinition;
  sort?: string;
  fields?: string[];
}

export interface CreateContactInput {
  list_id: string;
  email?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  title?: string;
  address_line1?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  tags?: string[];
  custom_fields?: Record<string, unknown>;
}

export interface UpdateContactInput {
  email?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  title?: string;
  address_line1?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  tags?: string[];
  custom_fields?: Record<string, unknown>;
}

export interface BulkAction {
  selection: {
    type: 'ids' | 'filter';
    contact_ids?: string[];
    filter?: FilterDefinition;
  };
  action: 'add_tags' | 'remove_tags' | 'delete' | 'move_to_list' | 'update_fields' | 'format_fields';
  params: Record<string, unknown>;
}

import type { FilterDefinition } from './api.types';
