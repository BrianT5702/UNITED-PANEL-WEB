import { ensureSeeded, getPageDocument, getSiteNav } from "@/lib/content";
import { PageRenderer } from "@/components/site/PageRenderer";

export const dynamic = "force-dynamic";

/** Shared loader for CMS-backed pages */
export async function renderPageDocument(pageId: string) {
  await ensureSeeded();
  const [document, navItems] = await Promise.all([getPageDocument(pageId), getSiteNav()]);
  return <PageRenderer document={document} navItems={navItems} />;
}
