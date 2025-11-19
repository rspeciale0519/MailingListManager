import { apiClient } from './client';
import type {
  Import,
  ImportPreview,
  ConfirmMappingInput,
  ImportOptions,
  PaginationMeta,
} from '@/types';

/**
 * Imports API
 */
export const importsApi = {
  /**
   * Start new import
   */
  create: async (
    orgId: string,
    listId: string,
    file: File,
    options?: ImportOptions,
    onProgress?: (progress: number) => void
  ): Promise<Import> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('list_id', listId);
    if (options) {
      formData.append('options', JSON.stringify(options));
    }

    const response = await apiClient.post(`/orgs/${orgId}/imports`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });

    return response.data.data;
  },

  /**
   * Get import status
   */
  get: async (orgId: string, importId: string): Promise<Import> => {
    const response = await apiClient.get(`/orgs/${orgId}/imports/${importId}`);
    return response.data.data;
  },

  /**
   * Get import preview for column mapping
   */
  getPreview: async (orgId: string, importId: string): Promise<ImportPreview> => {
    const response = await apiClient.get(`/orgs/${orgId}/imports/${importId}/preview`);
    return response.data.data;
  },

  /**
   * Confirm column mapping and start processing
   */
  confirmMapping: async (
    orgId: string,
    importId: string,
    mapping: ConfirmMappingInput
  ): Promise<Import> => {
    const response = await apiClient.post(`/orgs/${orgId}/imports/${importId}/mapping`, mapping);
    return response.data.data;
  },

  /**
   * Cancel import
   */
  cancel: async (
    orgId: string,
    importId: string,
    mode: 'reverse' | 'keep'
  ): Promise<Import> => {
    const response = await apiClient.post(`/orgs/${orgId}/imports/${importId}/cancel`, { mode });
    return response.data.data;
  },

  /**
   * List imports
   */
  list: async (
    orgId: string,
    params?: { page?: number; limit?: number }
  ): Promise<{ data: Import[]; meta: PaginationMeta }> => {
    const response = await apiClient.get(`/orgs/${orgId}/imports`, { params });
    return response.data;
  },
};
