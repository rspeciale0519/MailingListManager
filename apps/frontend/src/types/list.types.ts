export interface List {
  id: string;
  name: string;
  description?: string;
  color?: string;
  contact_count: number;
  tags: string[];
  created_by: {
    id: string;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

export interface CreateListInput {
  name: string;
  description?: string;
  color?: string;
  tags?: string[];
}

export interface UpdateListInput {
  name?: string;
  description?: string;
  color?: string;
  tags?: string[];
}
