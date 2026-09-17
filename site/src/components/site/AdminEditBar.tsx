import { isAuthenticated } from "@/lib/auth";
import { adminEditHref } from "@/lib/pages";
import { AdminEditBarClient } from "./AdminEditBarClient";

/** Shown only when an admin session is valid — never for public visitors. */
export async function AdminEditBar({ pageId }: { pageId: string }) {
  const ok = await isAuthenticated();
  if (!ok) return null;
  return <AdminEditBarClient editHref={adminEditHref(pageId)} />;
}
