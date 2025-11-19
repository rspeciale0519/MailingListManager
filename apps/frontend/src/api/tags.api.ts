import { apiClient } from './client';
import type { Tag, CreateTagInput, UpdateTagInput } from '@/types';

/**
 * Tags API
 */
export const tagsApi = {
  /**
   * List tags
   */
  list: async (orgId: string): Promise<Tag[]> => {
    const response = await apiClient.get(`/orgs/${orgId}/tags`);
    return response.data.data;
  },

  /**
   * Create tag
   */
  create: async (orgId: string, data: CreateTagInput): Promise<Tag> => {
    const response = await apiClient.post(`/orgs/${orgId}/tags`, data);
    return response.data.data;
  },

  /**
   * Update tag
   */
  update: async (orgId: string, tagId: string, data: UpdateTagInput): Promise<Tag> => {
    const response = await apiClient.patch(`/orgs/${orgId}/tags/${tagId}`, data);
    return response.data.data;
  },

  /**
   * Delete tag
   */
  delete: async (orgId: string, tagId: string): Promise<void> => {
    await apiClient.delete(`/orgs/${orgId}/tags/${tagId}`);
  },
};
