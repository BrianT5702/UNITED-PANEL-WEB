import { randomBytes } from "crypto";
import { prisma } from "./db";
import { cleanSubject } from "./page-document";

/**
 * Website enquiries live in the existing ContentSection table under this private page name.
 * cms-sync never exports this page, so personal details never land in cms-snapshot.json / git.
 */
export const ENQUIRY_PAGE = "__enquiries";

export type Enquiry = {
  id: string;
  createdAt: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  types: string[];
  subject: string;
  message: string;
};

export type EnquiryInput = Omit<Enquiry, "id" | "createdAt">;

function line(v: unknown, max: number): string {
  if (typeof v !== "string") return "";
  return v.replace(/[\u0000-\u001f\u007f\u2028\u2029]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function block(v: unknown, max: number): string {
  if (typeof v !== "string") return "";
  return v
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim()
    .slice(0, max);
}

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;
const PHONE_RE = /^[0-9+()\-./ ]{6,25}$/;

export type EnquiryCheck = { ok: true; value: EnquiryInput } | { ok: false; field: string; error: string };

/** Validate + clean what the public form sent. Never trust the browser. */
export function checkEnquiry(raw: unknown): EnquiryCheck {
  const b = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const name = line(b.name, 100);
  const company = line(b.company, 120);
  const email = line(b.email, 160);
  const phone = line(b.phone, 25);
  const subject = cleanSubject(b.subject);
  const message = block(b.message, 4000);
  const types = (Array.isArray(b.types) ? b.types : [])
    .map((t) => line(t, 60))
    .filter(Boolean)
    .slice(0, 12);

  if (!name) return { ok: false, field: "name", error: "Please enter your name." };
  if (!EMAIL_RE.test(email)) return { ok: false, field: "email", error: "Please enter a valid email address." };
  if (!PHONE_RE.test(phone)) return { ok: false, field: "phone", error: "Please enter a valid telephone number." };
  if (!subject) return { ok: false, field: "subject", error: "Please enter a subject." };
  if (message.length < 5) return { ok: false, field: "message", error: "Please enter your message." };
  return { ok: true, value: { name, company, email, phone, types, subject, message } };
}

export async function saveEnquiry(input: EnquiryInput): Promise<Enquiry> {
  const createdAt = new Date().toISOString();
  const id = `enq_${Date.now().toString(36)}${randomBytes(4).toString("hex")}`;
  const enquiry: Enquiry = { id, createdAt, ...input };
  await prisma.contentSection.create({
    data: { page: ENQUIRY_PAGE, key: id, data: JSON.stringify(enquiry) },
  });
  return enquiry;
}

export async function listEnquiries(): Promise<Enquiry[]> {
  const rows = await prisma.contentSection.findMany({ where: { page: ENQUIRY_PAGE } });
  const out: Enquiry[] = [];
  for (const row of rows) {
    try {
      const e = JSON.parse(row.data) as Enquiry;
      if (e && typeof e === "object") out.push({ ...e, id: row.key });
    } catch {
      /* skip unreadable */
    }
  }
  return out.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function deleteEnquiry(id: string): Promise<boolean> {
  const res = await prisma.contentSection.deleteMany({ where: { page: ENQUIRY_PAGE, key: id } });
  return res.count > 0;
}
