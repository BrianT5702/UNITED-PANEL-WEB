import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { ensureSeeded, getAllSitePages, getPageDocument, getSiteNav } from "@/lib/content";
import { VisualPageEditor } from "@/components/admin/VisualPageEditor";
import { getSitePage } from "@/lib/pages";

export const dynamic = "force-dynamic";

export default async function VisualEditHomePage() {
  if (!(await isAuthenticated())) {
    redirect("/admin/login");
  }
  await ensureSeeded();
  const page = getSitePage("home")!;
  const [document, navItems, pages] = await Promise.all([
    getPageDocument("home"),
    getSiteNav(),
    getAllSitePages(),
  ]);

  return (
    <div className="admin-body">
      <VisualPageEditor
        pageId="home"
        pageLabel={page.label}
        livePath={page.path}
        initial={document}
        initialNav={navItems}
        sitePages={pages}
      />
    </div>
  );
}
