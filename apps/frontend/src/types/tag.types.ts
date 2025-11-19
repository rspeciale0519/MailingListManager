export interface Tag {
  id: string;
  name: string;
  slug: string;
  color: string;
  description?: string;
  contact_count: number;
  created_at: string;
}

export interface CreateTagInput {
  name: string;
  color?: string;
  description?: string;
}

export interface UpdateTagInput {
  name?: string;
  color?: string;
  description?: string;
}
