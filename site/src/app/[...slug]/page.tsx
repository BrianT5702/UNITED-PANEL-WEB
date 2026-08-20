import { notFound } from "next/navigation";
import { ensureSeeded, getAllSitePages } from "@/lib/content";
import { renderPageDocument } from "@/lib/render-page";

export const dynamic = "force-dynamic";

/**
 * Serves admin-created CMS pages that do not have a dedicated route file.
 * Built-in routes (about/*, products/pir, etc.) take priority over this catch-all.
 */
export default async function CmsCatchAllPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const pageId = slug.join("/");
  await ensureSeeded();
  const pages = await getAllSitePages();
  const page = pages.find((p) => p.id === pageId);
  if (!page?.custom) notFound();
  return renderPageDocument(pageId);
}
