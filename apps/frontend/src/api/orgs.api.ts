import { apiClient } from './client';
import type { Org, OrgDetails, OrgMember } from '@/types';

/**
 * Organizations API
 */
export const orgsApi = {
  /**
   * List user's organizations
   */
  list: async (): Promise<Org[]> => {
    const response = await apiClient.get('/orgs');
    return response.data.data;
  },

  /**
   * Get organization details
   */
  get: async (orgId: string): Promise<OrgDetails> => {
    const response = await apiClient.get(`/orgs/${orgId}`);
    return response.data.data;
  },

  /**
   * Update organization
   */
  update: async (orgId: string, data: Partial<OrgDetails>): Promise<OrgDetails> => {
    const response = await apiClient.patch(`/orgs/${orgId}`, data);
    return response.data.data;
  },

  /**
   * List organization members
   */
  listMembers: async (orgId: string): Promise<OrgMember[]> => {
    const response = await apiClient.get(`/orgs/${orgId}/members`);
    return response.data.data;
  },

  /**
   * Invite team member
   */
  inviteMember: async (
    orgId: string,
    data: {
      email: string;
      org_role: string;
      permissions: Record<string, boolean>;
    }
  ): Promise<{ id: string; invitation_token: string }> => {
    const response = await apiClient.post(`/orgs/${orgId}/members/invite`, data);
    return response.data.data;
  },

  /**
   * Update member permissions
   */
  updateMember: async (
    orgId: string,
    membershipId: string,
    data: { permissions: Record<string, boolean> }
  ): Promise<OrgMember> => {
    const response = await apiClient.patch(`/orgs/${orgId}/members/${membershipId}`, data);
    return response.data.data;
  },

  /**
   * Remove team member
   */
  removeMember: async (orgId: string, membershipId: string): Promise<void> => {
    await apiClient.delete(`/orgs/${orgId}/members/${membershipId}`);
  },
};
