import { apiClient } from './client';
import type { Export, CreateExportInput, PaginationMeta } from '@/types';

/**
 * Exports API
 */
export const exportsApi = {
  /**
   * Create new export
   */
  create: async (orgId: string, data: CreateExportInput): Promise<{ id: string }> => {
    const response = await apiClient.post(`/orgs/${orgId}/exports`, data);
    return response.data.data;
  },

  /**
   * Get export status
   */
  get: async (orgId: string, exportId: string): Promise<Export> => {
    const response = await apiClient.get(`/orgs/${orgId}/exports/${exportId}`);
    return response.data.data;
  },

  /**
   * List exports
   */
  list: async (
    orgId: string,
    params?: { page?: number; limit?: number }
  ): Promise<{ data: Export[]; meta: PaginationMeta }> => {
    const response = await apiClient.get(`/orgs/${orgId}/exports`, { params });
    return response.data;
  },
};
