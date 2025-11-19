import type { JobStatus } from './api.types';

export interface Export {
  id: string;
  status: JobStatus;
  format: 'csv' | 'xlsx' | 'json' | 'vcard';
  row_count?: number;
  file_size?: number;
  download_url?: string;
  expires_at?: string;
  created_at: string;
  completed_at?: string;
}

export interface CreateExportInput {
  selection: {
    type: 'filter' | 'ids' | 'segment';
    filter_id?: string;
    contact_ids?: string[];
    segment_id?: string;
    list_id?: string;
  };
  columns: string[];
  format: 'csv' | 'xlsx' | 'json' | 'vcard';
  options?: {
    include_headers?: boolean;
    use_formatted?: boolean;
    delimiter?: string;
    encoding?: string;
  };
}
