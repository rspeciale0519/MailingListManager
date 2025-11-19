import type { JobStatus, Contact } from './';

export interface DedupRun {
  id: string;
  status: JobStatus;
  total_contacts?: number;
  duplicate_contacts?: number;
  cluster_count?: number;
  created_at: string;
  completed_at?: string;
}

export interface DedupCriteria {
  name: string;
  fields: DedupField[];
  fuzzy?: {
    enabled: boolean;
    algorithm?: 'jaro_winkler' | 'levenshtein';
    threshold?: number;
  };
}

export interface DedupField {
  field: string;
  weight: number;
  normalize: boolean;
}

export interface DedupCluster {
  cluster_id: string;
  confidence: number;
  member_count: number;
  reason_codes: string[];
  contacts: Contact[];
  suggested_survivor?: string;
  status: 'pending' | 'reviewed' | 'applied' | 'skipped';
}

export interface DedupDecision {
  cluster_id: string;
  survivor_id: string;
  discard_ids: string[];
  merge_strategy?: Record<string, string>;
}

export interface CreateDedupRunInput {
  list_id?: string;
  criteria: DedupCriteria;
  sample_only?: boolean;
}

export interface ApplyDedupInput {
  decisions: DedupDecision[];
}
