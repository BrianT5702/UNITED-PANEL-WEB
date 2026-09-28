import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ensureSeeded, getCataloguesPagePublic, getPublicSiteNav } from "@/lib/content";
import { listCatalogueItems } from "@/lib/catalogues";
import { defaultHomeContent } from "@/lib/defaults";
import {
  fileTypeLabel,
  formatBytes,
  formatUpdatedDate,
  uploadedFileSize,
} from "@/lib/catalogue-meta";
import { cataloguePermanentUrl } from "@/lib/site-origin";
import { isAuthenticated } from "@/lib/auth";
import { catalogueThumbUrl, isPdfItem } from "@/lib/catalogue-thumbs";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import {
  CatalogueLibrary,
  type LibraryItem,
} from "@/components/site/CatalogueLibrary";

export const metadata: Metadata = {
  title: "Catalogues & Brochures | United Panel-System",
  description:
    "Download product catalogues and brochures from United Panel-System — insulated panels for cold storage.",
};

export const dynamic = "force-dynamic";

export default async function CataloguesPage() {
  await ensureSeeded();
  const [navItems, items, isAdmin, requestHeaders, pagePublic] = await Promise.all([
    getPublicSiteNav(),
    listCatalogueItems({ publishedOnly: true }),
    isAuthenticated().catch(() => false),
    headers(),
    getCataloguesPagePublic(),
  ]);
  // Page switched off in the admin: visitors get a 404, signed-in admins can still preview it.
  // (Individual /r/<id> links and printed QR codes keep working.)
  if (!pagePublic && !isAdmin) notFound();

  const libraryItems: LibraryItem[] = await Promise.all(
    items.map(async (item) => ({
      id: item.id,
      title: item.title,
      kind: item.kind,
      description: item.description,
      fileUrl: item.fileUrl,
      fileName: item.fileName,
      isImage: item.mimeType.startsWith("image/"),
      // First-page preview. If it doesn't exist yet, /r/<id>/thumb renders it on
      // first request; the card falls back to the designed cover if that fails.
      thumbUrl: isPdfItem(item)
        ? ((await catalogueThumbUrl(item.id)) ??
          `/r/${item.id}/thumb?v=${Date.parse(item.updatedAt) || 0}`)
        : null,
      fileType: fileTypeLabel(item.mimeType, item.fileName),
      fileSize: formatBytes(await uploadedFileSize(item.fileUrl)),
      updated: formatUpdatedDate(item.updatedAt),
      // Permanent links use the site URL from env, or the current host as a fallback
      permanentUrl: cataloguePermanentUrl(item.id, { headers: requestHeaders }),
    })),
  );

  const settings = defaultHomeContent.settings;
  const footer = {
    ...defaultHomeContent.footer,
    tagline: "Catalogues & brochures",
  };

  return (
    <>
      <SiteHeader settings={settings} navItems={navItems} />
      <main>
        <section className="section cat-lib" aria-labelledby="cat-lib-title">
          {!pagePublic ? (
            <div className="cat-lib-hidden-banner" role="status">
              <strong>Hidden from public</strong> — only admins can see this page. Turn it back
              on in <Link href="/admin/catalogues">Catalogues &amp; brochures</Link>.
            </div>
          ) : null}
          <header className="cat-lib-head">
            <p className="eyebrow">Resources</p>
            <h1 id="cat-lib-title">Catalogues &amp; brochures</h1>
            <p className="cat-lib-lead">
              Product literature for our insulated panel systems — view online, download, or
              share.
            </p>
          </header>
          <CatalogueLibrary items={libraryItems} isAdmin={isAdmin} />
        </section>
      </main>
      <SiteFooter footer={footer} />
    </>
  );
}
