import { createCookieSessionStorage, redirect } from "@remix-run/node";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { db } from "./db.server";

type LoginForm = {
  email: string;
  password: string;
};

export async function register({ email, password }: LoginForm) {
  const passwordHash = await bcrypt.hash(password, 10);
  const userId = randomUUID();

  try {
    await db.execute({
      sql: "INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)",
      args: [userId, email.toLowerCase(), passwordHash, Date.now()]
    });
    return { id: userId, email };
  } catch (error) {
    return null;
  }
}

export async function login({ email, password }: LoginForm) {
  const result = await db.execute({
    sql: "SELECT * FROM users WHERE email = ?",
    args: [email.toLowerCase()]
  });

  if (result.rows.length === 0) {
    return null;
  }

  const user = result.rows[0];
  const isCorrectPassword = await bcrypt.compare(
    password,
    user.password_hash as string
  );

  if (!isCorrectPassword) {
    return null;
  }

  return {
    id: user.id as string,
    email: user.email as string
  };
}

const sessionSecret = process.env.SESSION_SECRET || "default-secret-change-me";

const storage = createCookieSessionStorage({
  cookie: {
    name: "mailing_list_session",
    secure: process.env.NODE_ENV === "production",
    secrets: [sessionSecret],
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    httpOnly: true
  }
});

export async function createUserSession(userId: string, redirectTo: string) {
  const session = await storage.getSession();
  session.set("userId", userId);
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await storage.commitSession(session)
    }
  });
}

export async function getUserSession(request: Request) {
  return storage.getSession(request.headers.get("Cookie"));
}

export async function getUserId(request: Request) {
  const session = await getUserSession(request);
  const userId = session.get("userId");
  if (!userId || typeof userId !== "string") return null;
  return userId;
}

export async function requireUserId(
  request: Request,
  redirectTo: string = new URL(request.url).pathname
) {
  const session = await getUserSession(request);
  const userId = session.get("userId");
  if (!userId || typeof userId !== "string") {
    const searchParams = new URLSearchParams([
      ["redirectTo", redirectTo]
    ]);
    throw redirect(`/login?${searchParams}`);
  }
  return userId;
}

export async function getUser(request: Request) {
  const userId = await getUserId(request);
  if (typeof userId !== "string") {
    return null;
  }

  try {
    const result = await db.execute({
      sql: "SELECT id, email FROM users WHERE id = ?",
      args: [userId]
    });
    
    if (result.rows.length === 0) return null;
    
    return {
      id: result.rows[0].id as string,
      email: result.rows[0].email as string
    };
  } catch {
    throw logout(request);
  }
}

export async function logout(request: Request) {
  const session = await getUserSession(request);
  return redirect("/login", {
    headers: {
      "Set-Cookie": await storage.destroySession(session)
    }
  });
}
