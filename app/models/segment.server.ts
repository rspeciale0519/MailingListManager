import { db } from "~/utils/db.server";
import { getRecordsByCampaignId, Record } from "./list.server";

export type FilterCondition = {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'notEquals' | 'notContains';
  value: string;
};

export type Segment = {
  id: string;
  campaignId: string;
  userId: string;
  name: string;
  filterConditions: FilterCondition[];
  createdAt: number;
};

export async function getSegmentsByCampaignId(campaignId: string): Promise<Segment[]> {
  const result = await db.execute({
    sql: "SELECT id, campaign_id, user_id, name, filter_conditions, created_at FROM segments WHERE campaign_id = ? ORDER BY created_at DESC",
    args: [campaignId]
  });

  return result.rows.map(row => ({
    id: row.id as string,
    campaignId: row.campaign_id as string,
    userId: row.user_id as string,
    name: row.name as string,
    filterConditions: JSON.parse(row.filter_conditions as string),
    createdAt: row.created_at as number
  }));
}

export async function getSegmentById(id: string): Promise<Segment | null> {
  const result = await db.execute({
    sql: "SELECT id, campaign_id, user_id, name, filter_conditions, created_at FROM segments WHERE id = ?",
    args: [id]
  });

  if (result.rows.length === 0) {
    return null;
  }

  return {
    id: result.rows[0].id as string,
    campaignId: result.rows[0].campaign_id as string,
    userId: result.rows[0].user_id as string,
    name: result.rows[0].name as string,
    filterConditions: JSON.parse(result.rows[0].filter_conditions as string),
    createdAt: result.rows[0].created_at as number
  };
}

export async function createSegment(
  campaignId: string,
  userId: string,
  name: string,
  filterConditions: FilterCondition[]
): Promise<Segment> {
  const id = crypto.randomUUID();
  const createdAt = Date.now();

  await db.execute({
    sql: "INSERT INTO segments (id, campaign_id, user_id, name, filter_conditions, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    args: [
      id,
      campaignId,
      userId,
      name,
      JSON.stringify(filterConditions),
      createdAt
    ]
  });

  return {
    id,
    campaignId,
    userId,
    name,
    filterConditions,
    createdAt
  };
}

export async function updateSegment(
  id: string,
  name: string,
  filterConditions: FilterCondition[]
): Promise<Segment | null> {
  const segment = await getSegmentById(id);
  if (!segment) {
    return null;
  }

  await db.execute({
    sql: "UPDATE segments SET name = ?, filter_conditions = ? WHERE id = ?",
    args: [name, JSON.stringify(filterConditions), id]
  });

  return {
    ...segment,
    name,
    filterConditions
  };
}

export async function deleteSegment(id: string): Promise<boolean> {
  try {
    await db.execute({
      sql: "DELETE FROM segments WHERE id = ?",
      args: [id]
    });
    return true;
  } catch (error) {
    console.error("Error deleting segment:", error);
    return false;
  }
}

export async function getRecordsBySegment(segmentId: string): Promise<Record[]> {
  const segment = await getSegmentById(segmentId);
  if (!segment) {
    return [];
  }

  const allRecords = await getRecordsByCampaignId(segment.campaignId);
  
  return allRecords.filter(record => {
    return segment.filterConditions.every(condition => {
      const fieldValue = record.data[condition.field];
      if (fieldValue === undefined) return false;
      
      switch (condition.operator) {
        case 'equals':
          return fieldValue === condition.value;
        case 'notEquals':
          return fieldValue !== condition.value;
        case 'contains':
          return fieldValue.toLowerCase().includes(condition.value.toLowerCase());
        case 'notContains':
          return !fieldValue.toLowerCase().includes(condition.value.toLowerCase());
        case 'startsWith':
          return fieldValue.toLowerCase().startsWith(condition.value.toLowerCase());
        case 'endsWith':
          return fieldValue.toLowerCase().endsWith(condition.value.toLowerCase());
        default:
          return false;
      }
    });
  });
}
