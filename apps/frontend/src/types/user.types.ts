export interface OrgMembership {
  organization_id: string;
  role: string;
  permissions: Record<string, boolean>;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  timezone?: string;
  locale?: string;
  mfa_enabled: boolean;
  created_at: string;
  organization_memberships?: OrgMembership[];
}

export interface Org {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  role: 'account_owner' | 'team_member' | 'org_admin_delegate';
  created_at: string;
}

export interface OrgDetails extends Org {
  status: string;
  settings: OrgSettings;
  usage: OrgUsage;
  updated_at: string;
}

export interface OrgSettings {
  default_country?: string;
  timezone?: string;
  date_format?: string;
  formatting_rules?: {
    company_designator_punctuation?: boolean;
    suffix_punctuation?: boolean;
    preserve_brand_acronyms?: boolean;
  };
}

export interface OrgUsage {
  contacts: number;
  contacts_limit: number;
  lists: number;
  lists_limit?: number;
  team_members: number;
  team_members_limit: number;
}

export interface OrgMember {
  id: string;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  org_role: string;
  permissions: Record<string, boolean>;
  joined_at: string;
  last_active_at?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface LoginResponse {
  user: User;
  orgs: Org[];
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface RegisterInput {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  org_name: string;
}
