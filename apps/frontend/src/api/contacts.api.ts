import { apiClient } from './client';
import type {
  Contact,
  ContactFilters,
  CreateContactInput,
  UpdateContactInput,
  BulkAction,
  PaginationMeta,
} from '@/types';

/**
 * Contacts API
 */
export const contactsApi = {
  /**
   * List contacts with filters
   */
  list: async (
    orgId: string,
    filters: ContactFilters
  ): Promise<{ data: Contact[]; meta: PaginationMeta }> => {
    const response = await apiClient.get(`/orgs/${orgId}/contacts`, {
      params: filters,
    });
    return response.data;
  },

  /**
   * Advanced search with complex filters
   */
  search: async (
    orgId: string,
    searchParams: {
      filter?: unknown;
      sort?: string[];
      page?: number;
      limit?: number;
    }
  ): Promise<{ data: Contact[]; meta: PaginationMeta }> => {
    const response = await apiClient.post(`/orgs/${orgId}/contacts/search`, searchParams);
    return response.data;
  },

  /**
   * Get single contact
   */
  get: async (orgId: string, contactId: string): Promise<Contact> => {
    const response = await apiClient.get(`/orgs/${orgId}/contacts/${contactId}`);
    return response.data.data;
  },

  /**
   * Create new contact
   */
  create: async (orgId: string, data: CreateContactInput): Promise<Contact> => {
    const response = await apiClient.post(`/orgs/${orgId}/contacts`, data);
    return response.data.data;
  },

  /**
   * Update contact
   */
  update: async (orgId: string, contactId: string, data: UpdateContactInput): Promise<Contact> => {
    const response = await apiClient.patch(`/orgs/${orgId}/contacts/${contactId}`, data);
    return response.data.data;
  },

  /**
   * Delete contact
   */
  delete: async (orgId: string, contactId: string): Promise<void> => {
    await apiClient.delete(`/orgs/${orgId}/contacts/${contactId}`);
  },

  /**
   * Bulk operations
   */
  bulk: async (orgId: string, action: BulkAction): Promise<{ job_id: string }> => {
    const response = await apiClient.post(`/orgs/${orgId}/contacts/bulk`, action);
    return response.data.data;
  },
};
