import { redirect, notFound } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { ensureSeeded, findSitePage, getPageDocument, getSiteNav, getAllSitePages } from "@/lib/content";
import { VisualPageEditor } from "@/components/admin/VisualPageEditor";
import { pageIdFromPathSegments } from "@/lib/pages";

export const dynamic = "force-dynamic";

/** Legacy short paths → registry page ids */
const ALIASES: Record<string, string> = {
  pir: "products/pir",
  pu: "products/pu",
  pur: "products/pu",
  rockwool: "products/rockwool",
};

export default async function VisualEditCatchAllPage({
  params,
}: {
  params: Promise<{ pageId: string[] }>;
}) {
  if (!(await isAuthenticated())) {
    redirect("/admin/login");
  }

  const { pageId: segments } = await params;
  let id = pageIdFromPathSegments(segments);
  if (ALIASES[id]) id = ALIASES[id];

  await ensureSeeded();
  const page = await findSitePage(id);
  if (!page) notFound();

  const [document, navItems, pages] = await Promise.all([
    getPageDocument(id),
    getSiteNav(),
    getAllSitePages(),
  ]);

  return (
    <div className="admin-body">
      <VisualPageEditor
        pageId={id}
        pageLabel={page.label}
        livePath={page.path}
        initial={document}
        initialNav={navItems}
        sitePages={pages}
      />
    </div>
  );
}
