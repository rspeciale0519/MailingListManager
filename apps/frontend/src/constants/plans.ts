export const PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    limits: {
      contacts: 1000,
      lists: 5,
      imports_per_month: 10,
      file_size_mb: 5,
      team_members: 0,
    },
    features: [
      'Single Account Owner',
      '1,000 contacts max',
      '5 lists max',
      '10 imports per month',
      '5MB file size limit',
      'Standard support (email only)',
    ],
  },
  STARTER: {
    id: 'starter',
    name: 'Starter',
    price: 29,
    limits: {
      contacts: 10000,
      lists: 25,
      imports_per_month: 100,
      file_size_mb: 50,
      team_members: 0,
    },
    features: [
      'Single Account Owner',
      '10,000 contacts',
      '25 lists',
      '100 imports per month',
      '50MB file size limit',
      'Email support with 48hr response',
    ],
  },
  PRO: {
    id: 'pro',
    name: 'Pro',
    price: 99,
    limits: {
      contacts: 50000,
      lists: -1, // unlimited
      imports_per_month: -1, // unlimited
      file_size_mb: 500,
      team_members: 2,
      additional_team_members_price: 15,
    },
    features: [
      'Account Owner + 2 Team Members',
      'Up to 3 additional paid Team Members ($15/each)',
      '50,000 contacts',
      'Unlimited lists',
      'Unlimited imports',
      '500MB file size limit',
      'Priority email support (24hr response)',
      'Advanced features: saved filters, layout presets, API access',
    ],
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 499,
    limits: {
      contacts: 500000,
      lists: -1,
      imports_per_month: -1,
      file_size_mb: 2048,
      team_members: 10,
      additional_team_members_price: 10,
    },
    features: [
      'Account Owner + 10 Team Members',
      'Unlimited additional Team Members ($10/each)',
      '500,000+ contacts (custom pricing above)',
      'Unlimited lists and imports',
      '2GB file size limit',
      'SSO (SAML/OAuth)',
      'Dedicated account manager',
      'Phone support',
      'Custom SLA',
      'Audit log retention (2 years)',
      'Optional: database-per-tenant, custom integrations',
    ],
  },
} as const;

export type PlanId = keyof typeof PLANS;
