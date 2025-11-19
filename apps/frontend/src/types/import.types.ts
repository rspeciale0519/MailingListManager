import type { JobStatus, JobProgress } from './api.types';

export interface Import {
  id: string;
  status: JobStatus;
  source_filename: string;
  file_size?: number;
  total_rows?: number;
  processed_rows?: number;
  valid_rows?: number;
  invalid_rows?: number;
  progress?: JobProgress;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface ImportPreview {
  headers: string[];
  rows: Record<string, unknown>[];
  suggested_mapping: ColumnMapping[];
}

export interface ColumnMapping {
  source_header: string;
  target_field: string;
  confidence: number;
  reason: string;
  transforms?: string[];
  create_new?: boolean;
  field_type?: string;
}

export interface ConfirmMappingInput {
  mappings: ColumnMapping[];
}

export interface ImportOptions {
  skip_duplicates?: boolean;
  update_existing?: boolean;
  auto_dedup?: boolean;
  auto_tag?: string;
}
