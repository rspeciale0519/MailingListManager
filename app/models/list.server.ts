import { db } from "~/utils/db.server";

export type SystemHeader = {
  id: string;
  name: string;
  isRequired: boolean;
};

export type UploadedList = {
  id: string;
  campaignId: string;
  userId: string;
  filename: string;
  originalHeaders: string[];
  mappedHeaders: Record<string, string>;
  createdAt: number;
};

export type Record = {
  id: string;
  listId: string;
  campaignId: string;
  userId: string;
  data: Record<string, string>;
  createdAt: number;
};

export async function getSystemHeaders(): Promise<SystemHeader[]> {
  const result = await db.execute({
    sql: "SELECT id, name, is_required FROM system_headers ORDER BY name ASC"
  });

  return result.rows.map(row => ({
    id: row.id as string,
    name: row.name as string,
    isRequired: Boolean(row.is_required)
  }));
}

export async function getListsByCampaignId(campaignId: string): Promise<UploadedList[]> {
  const result = await db.execute({
    sql: "SELECT id, campaign_id, user_id, filename, original_headers, mapped_headers, created_at FROM uploaded_lists WHERE campaign_id = ? ORDER BY created_at DESC",
    args: [campaignId]
  });

  return result.rows.map(row => ({
    id: row.id as string,
    campaignId: row.campaign_id as string,
    userId: row.user_id as string,
    filename: row.filename as string,
    originalHeaders: JSON.parse(row.original_headers as string),
    mappedHeaders: JSON.parse(row.mapped_headers as string),
    createdAt: row.created_at as number
  }));
}

export async function getListById(id: string): Promise<UploadedList | null> {
  const result = await db.execute({
    sql: "SELECT id, campaign_id, user_id, filename, original_headers, mapped_headers, created_at FROM uploaded_lists WHERE id = ?",
    args: [id]
  });

  if (result.rows.length === 0) {
    return null;
  }

  return {
    id: result.rows[0].id as string,
    campaignId: result.rows[0].campaign_id as string,
    userId: result.rows[0].user_id as string,
    filename: result.rows[0].filename as string,
    originalHeaders: JSON.parse(result.rows[0].original_headers as string),
    mappedHeaders: JSON.parse(result.rows[0].mapped_headers as string),
    createdAt: result.rows[0].created_at as number
  };
}

export async function createList(
  campaignId: string,
  userId: string,
  filename: string,
  originalHeaders: string[],
  mappedHeaders: Record<string, string>
): Promise<UploadedList> {
  const id = crypto.randomUUID();
  const createdAt = Date.now();

  await db.execute({
    sql: "INSERT INTO uploaded_lists (id, campaign_id, user_id, filename, original_headers, mapped_headers, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    args: [
      id,
      campaignId,
      userId,
      filename,
      JSON.stringify(originalHeaders),
      JSON.stringify(mappedHeaders),
      createdAt
    ]
  });

  return {
    id,
    campaignId,
    userId,
    filename,
    originalHeaders,
    mappedHeaders,
    createdAt
  };
}

export async function deleteList(id: string): Promise<boolean> {
  try {
    // First delete all records associated with this list
    await db.execute({
      sql: "DELETE FROM records WHERE list_id = ?",
      args: [id]
    });

    // Then delete the list
    await db.execute({
      sql: "DELETE FROM uploaded_lists WHERE id = ?",
      args: [id]
    });

    return true;
  } catch (error) {
    console.error("Error deleting list:", error);
    return false;
  }
}

export async function createRecord(
  listId: string,
  campaignId: string,
  userId: string,
  data: Record<string, string>
): Promise<Record> {
  const id = crypto.randomUUID();
  const createdAt = Date.now();

  await db.execute({
    sql: "INSERT INTO records (id, list_id, campaign_id, user_id, data, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    args: [
      id,
      listId,
      campaignId,
      userId,
      JSON.stringify(data),
      createdAt
    ]
  });

  return {
    id,
    listId,
    campaignId,
    userId,
    data,
    createdAt
  };
}

export async function getRecordsByListId(listId: string): Promise<Record[]> {
  const result = await db.execute({
    sql: "SELECT id, list_id, campaign_id, user_id, data, created_at FROM records WHERE list_id = ? ORDER BY created_at ASC",
    args: [listId]
  });

  return result.rows.map(row => ({
    id: row.id as string,
    listId: row.list_id as string,
    campaignId: row.campaign_id as string,
    userId: row.user_id as string,
    data: JSON.parse(row.data as string),
    createdAt: row.created_at as number
  }));
}

export async function getRecordsByCampaignId(campaignId: string): Promise<Record[]> {
  const result = await db.execute({
    sql: "SELECT id, list_id, campaign_id, user_id, data, created_at FROM records WHERE campaign_id = ? ORDER BY created_at ASC",
    args: [campaignId]
  });

  return result.rows.map(row => ({
    id: row.id as string,
    listId: row.list_id as string,
    campaignId: row.campaign_id as string,
    userId: row.user_id as string,
    data: JSON.parse(row.data as string),
    createdAt: row.created_at as number
  }));
}
