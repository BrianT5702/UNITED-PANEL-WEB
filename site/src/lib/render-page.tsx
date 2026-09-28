import { ensureSeeded, getPageDocument, getPublicSiteNav } from "@/lib/content";
import { PageRenderer } from "@/components/site/PageRenderer";

export const dynamic = "force-dynamic";

/** Shared loader for CMS-backed pages */
export async function renderPageDocument(pageId: string) {
  await ensureSeeded();
  const [document, navItems] = await Promise.all([getPageDocument(pageId), getPublicSiteNav()]);
  return <PageRenderer pageId={pageId} document={document} navItems={navItems} />;
}
