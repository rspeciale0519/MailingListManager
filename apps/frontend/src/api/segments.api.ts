import { apiClient } from './client';
import type {
  Segment,
  CreateSegmentInput,
  UpdateSegmentInput,
  Contact,
  PaginationMeta,
} from '@/types';

/**
 * Segments API
 */
export const segmentsApi = {
  /**
   * List segments
   */
  list: async (orgId: string): Promise<Segment[]> => {
    const response = await apiClient.get(`/orgs/${orgId}/segments`);
    return response.data.data;
  },

  /**
   * Create segment
   */
  create: async (orgId: string, data: CreateSegmentInput): Promise<Segment> => {
    const response = await apiClient.post(`/orgs/${orgId}/segments`, data);
    return response.data.data;
  },

  /**
   * Get segment details
   */
  get: async (orgId: string, segmentId: string): Promise<Segment> => {
    const response = await apiClient.get(`/orgs/${orgId}/segments/${segmentId}`);
    return response.data.data;
  },

  /**
   * Update segment
   */
  update: async (
    orgId: string,
    segmentId: string,
    data: UpdateSegmentInput
  ): Promise<Segment> => {
    const response = await apiClient.patch(`/orgs/${orgId}/segments/${segmentId}`, data);
    return response.data.data;
  },

  /**
   * Delete segment
   */
  delete: async (orgId: string, segmentId: string): Promise<void> => {
    await apiClient.delete(`/orgs/${orgId}/segments/${segmentId}`);
  },

  /**
   * Get contacts in segment
   */
  getContacts: async (
    orgId: string,
    segmentId: string,
    params?: { page?: number; limit?: number }
  ): Promise<{ data: Contact[]; meta: PaginationMeta }> => {
    const response = await apiClient.get(`/orgs/${orgId}/segments/${segmentId}/contacts`, {
      params,
    });
    return response.data;
  },

  /**
   * Refresh segment cache
   */
  refresh: async (orgId: string, segmentId: string): Promise<{ job_id: string }> => {
    const response = await apiClient.post(`/orgs/${orgId}/segments/${segmentId}/refresh`);
    return response.data.data;
  },
};
