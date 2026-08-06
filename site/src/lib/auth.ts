import { cookies } from "next/headers";
import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { prisma } from "./db";

const COOKIE_NAME = "ur_admin_session";
const SESSION_DAYS = 7;

function hashPassword(password: string) {
  return createHash("sha256")
    .update(`${process.env.SESSION_SECRET || "ur"}:${password}`)
    .digest("hex");
}

export function verifyAdminPassword(password: string) {
  const expected = process.env.ADMIN_PASSWORD || "unitedpanel-admin";
  const a = Buffer.from(hashPassword(password));
  const b = Buffer.from(hashPassword(expected));
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function createSession() {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.create({ data: { token, expiresAt } });
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
    cookieStore.delete(COOKIE_NAME);
  }
}

export async function getSessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value ?? null;
}

export async function isAuthenticated() {
  const token = await getSessionToken();
  if (!token) return false;
  const session = await prisma.session.findUnique({ where: { token } });
  if (!session) return false;
  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { token } });
    return false;
  }
  return true;
}

export async function requireAuth() {
  const ok = await isAuthenticated();
  if (!ok) {
    throw new Error("UNAUTHORIZED");
  }
}
