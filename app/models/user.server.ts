import { db } from "~/utils/db.server";

export type User = {
  id: string;
  email: string;
};

export async function getUserById(id: string): Promise<User | null> {
  const result = await db.execute({
    sql: "SELECT id, email FROM users WHERE id = ?",
    args: [id]
  });

  if (result.rows.length === 0) {
    return null;
  }

  return {
    id: result.rows[0].id as string,
    email: result.rows[0].email as string
  };
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await db.execute({
    sql: "SELECT id, email FROM users WHERE email = ?",
    args: [email.toLowerCase()]
  });

  if (result.rows.length === 0) {
    return null;
  }

  return {
    id: result.rows[0].id as string,
    email: result.rows[0].email as string
  };
}
