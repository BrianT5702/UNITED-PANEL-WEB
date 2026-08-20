import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { ensureSeeded, getAllSitePages, getSiteNav } from "@/lib/content";
import { NavEditor } from "@/components/admin/NavEditor";

export const dynamic = "force-dynamic";

export default async function AdminNavPage() {
  if (!(await isAuthenticated())) {
    redirect("/admin/login");
  }
  await ensureSeeded();
  const [items, pages] = await Promise.all([getSiteNav(), getAllSitePages()]);

  return (
    <div className="admin-body">
      <NavEditor initial={items} initialPages={pages} />
    </div>
  );
}
