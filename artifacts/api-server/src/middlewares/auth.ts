import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

const SECRET = process.env.SESSION_SECRET ?? "dev-secret";

export interface JwtPayload {
  userId: number;
}

export function signToken(userId: number): string {
  return jwt.sign({ userId }, SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.userId)).limit(1);
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    (req as any).user = user;
    next();
  } catch (err) {
    logger.error({ err }, "Auth middleware error");
    res.status(500).json({ error: "Internal server error" });
  }
}

export function getUser(req: Request) {
  return (req as any).user as import("@workspace/db").User;
}
