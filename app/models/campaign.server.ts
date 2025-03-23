import { db } from "~/utils/db.server";
import { randomUUID } from "crypto";

export type Campaign = {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  createdAt: number;
};

export async function getCampaignsByUserId(userId: string): Promise<Campaign[]> {
  const result = await db.execute({
    sql: "SELECT id, user_id, name, description, created_at FROM campaigns WHERE user_id = ? ORDER BY created_at DESC",
    args: [userId]
  });

  return result.rows.map(row => ({
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    description: row.description as string | null,
    createdAt: row.created_at as number
  }));
}

export async function getCampaignById(id: string): Promise<Campaign | null> {
  const result = await db.execute({
    sql: "SELECT id, user_id, name, description, created_at FROM campaigns WHERE id = ?",
    args: [id]
  });

  if (result.rows.length === 0) {
    return null;
  }

  return {
    id: result.rows[0].id as string,
    userId: result.rows[0].user_id as string,
    name: result.rows[0].name as string,
    description: result.rows[0].description as string | null,
    createdAt: result.rows[0].created_at as number
  };
}

export async function createCampaign(userId: string, name: string, description: string | null): Promise<Campaign> {
  const id = randomUUID();
  const createdAt = Date.now();

  await db.execute({
    sql: "INSERT INTO campaigns (id, user_id, name, description, created_at) VALUES (?, ?, ?, ?, ?)",
    args: [id, userId, name, description, createdAt]
  });

  return {
    id,
    userId,
    name,
    description,
    createdAt
  };
}

export async function updateCampaign(id: string, name: string, description: string | null): Promise<Campaign | null> {
  const campaign = await getCampaignById(id);
  if (!campaign) {
    return null;
  }

  await db.execute({
    sql: "UPDATE campaigns SET name = ?, description = ? WHERE id = ?",
    args: [name, description, id]
  });

  return {
    ...campaign,
    name,
    description
  };
}

export async function deleteCampaign(id: string): Promise<boolean> {
  try {
    // First delete all segments associated with this campaign
    await db.execute({
      sql: "DELETE FROM segments WHERE campaign_id = ?",
      args: [id]
    });

    // Get all lists associated with this campaign
    const listsResult = await db.execute({
      sql: "SELECT id FROM uploaded_lists WHERE campaign_id = ?",
      args: [id]
    });

    // Delete all records associated with these lists
    for (const row of listsResult.rows) {
      await db.execute({
        sql: "DELETE FROM records WHERE list_id = ?",
        args: [row.id as string]
      });
    }

    // Delete all lists associated with this campaign
    await db.execute({
      sql: "DELETE FROM uploaded_lists WHERE campaign_id = ?",
      args: [id]
    });

    // Finally delete the campaign
    await db.execute({
      sql: "DELETE FROM campaigns WHERE id = ?",
      args: [id]
    });

    return true;
  } catch (error) {
    console.error("Error deleting campaign:", error);
    return false;
  }
}
