import { apiClient } from './client';
import type { List, CreateListInput, UpdateListInput, PaginationMeta } from '@/types';

/**
 * Lists API
 */
export const listsApi = {
  /**
   * List all lists
   */
  list: async (
    orgId: string,
    params?: { page?: number; limit?: number; sort?: string }
  ): Promise<{ data: List[]; meta: PaginationMeta }> => {
    const response = await apiClient.get(`/orgs/${orgId}/lists`, { params });
    return response.data;
  },

  /**
   * Get list details
   */
  get: async (orgId: string, listId: string): Promise<List> => {
    const response = await apiClient.get(`/orgs/${orgId}/lists/${listId}`);
    return response.data.data;
  },

  /**
   * Create new list
   */
  create: async (orgId: string, data: CreateListInput): Promise<List> => {
    const response = await apiClient.post(`/orgs/${orgId}/lists`, data);
    return response.data.data;
  },

  /**
   * Update list
   */
  update: async (orgId: string, listId: string, data: UpdateListInput): Promise<List> => {
    const response = await apiClient.patch(`/orgs/${orgId}/lists/${listId}`, data);
    return response.data.data;
  },

  /**
   * Delete list
   */
  delete: async (orgId: string, listId: string): Promise<void> => {
    await apiClient.delete(`/orgs/${orgId}/lists/${listId}`);
  },
};
