import { apiClient } from './client';
import type {
  DedupRun,
  DedupCluster,
  CreateDedupRunInput,
  ApplyDedupInput,
  PaginationMeta,
} from '@/types';

/**
 * Deduplication API
 */
export const dedupApi = {
  /**
   * Create dedup run
   */
  create: async (orgId: string, data: CreateDedupRunInput): Promise<{ id: string }> => {
    const response = await apiClient.post(`/orgs/${orgId}/dedup/runs`, data);
    return response.data.data;
  },

  /**
   * Get dedup run status
   */
  get: async (orgId: string, runId: string): Promise<DedupRun> => {
    const response = await apiClient.get(`/orgs/${orgId}/dedup/runs/${runId}`);
    return response.data.data;
  },

  /**
   * Get clusters for review
   */
  getClusters: async (
    orgId: string,
    runId: string,
    params?: { page?: number; limit?: number; min_confidence?: number }
  ): Promise<{ data: DedupCluster[]; meta: PaginationMeta }> => {
    const response = await apiClient.get(`/orgs/${orgId}/dedup/runs/${runId}/clusters`, {
      params,
    });
    return response.data;
  },

  /**
   * Apply dedup decisions
   */
  apply: async (
    orgId: string,
    runId: string,
    decisions: ApplyDedupInput
  ): Promise<{ job_id: string }> => {
    const response = await apiClient.post(`/orgs/${orgId}/dedup/runs/${runId}/apply`, decisions);
    return response.data.data;
  },

  /**
   * Undo merge
   */
  undoMerge: async (orgId: string, mergeId: string): Promise<void> => {
    await apiClient.post(`/orgs/${orgId}/dedup/merges/${mergeId}/undo`);
  },
};
