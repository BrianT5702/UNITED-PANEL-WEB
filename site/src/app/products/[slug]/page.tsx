import { notFound } from "next/navigation";
import { ensureSeeded, getAllSitePages } from "@/lib/content";
import { renderPageDocument } from "@/lib/render-page";

export const dynamic = "force-dynamic";

/** Custom product pages created in admin (e.g. /products/new-line) */
export default async function ProductSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pageId = `products/${slug}`;
  await ensureSeeded();
  const pages = await getAllSitePages();
  const page = pages.find((p) => p.id === pageId);
  if (page) {
    return renderPageDocument(pageId);
  }
  notFound();
}
