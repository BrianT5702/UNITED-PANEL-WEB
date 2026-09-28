import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCatalogueItem, kindLabel } from "@/lib/catalogues";
import { defaultHomeContent } from "@/lib/defaults";
import Link from "next/link";
import { getCataloguesPagePublic, getPublicSiteNav } from "@/lib/content";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { headers } from "next/headers";
import { CatalogueViewer } from "@/components/site/CatalogueViewer";
import { CatalogueShareButton } from "@/components/site/CatalogueShareButton";
import { catalogueThumbUrl, isPdfItem } from "@/lib/catalogue-thumbs";
import { cataloguePermanentUrl } from "@/lib/site-origin";
import {
  fileTypeLabel,
  formatBytes,
  formatUpdatedDate,
  uploadedFileSize,
} from "@/lib/catalogue-meta";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const item = await getCatalogueItem(id);
  if (!item || !item.published) {
    return { title: "Document | United Panel-System" };
  }
  return {
    title: `${item.title} | United Panel-System`,
    description: item.description || `${kindLabel(item.kind)} from United Panel-System`,
  };
}

export default async function CatalogueRedirectLanding({ params }: Props) {
  const { id } = await params;
  const item = await getCatalogueItem(id);
  if (!item || !item.published) notFound();

  // This page keeps working even when the Catalogues page is switched off
  // (printed QR codes must not break); only the "Back to catalogues" link hides.
  const [navItems, cataloguesPublic, requestHeaders, size] = await Promise.all([
    getPublicSiteNav(),
    getCataloguesPagePublic(),
    headers(),
    uploadedFileSize(item.fileUrl),
  ]);
  const settings = defaultHomeContent.settings;
  const footer = {
    ...defaultHomeContent.footer,
    tagline: item.title,
  };
  const isPdf = isPdfItem(item);
  const thumbUrl = isPdf
    ? ((await catalogueThumbUrl(item.id)) ?? `/r/${item.id}/thumb?v=${Date.parse(item.updatedAt) || 0}`)
    : null;
  const meta = [
    fileTypeLabel(item.mimeType, item.fileName),
    formatBytes(size),
    `Updated ${formatUpdatedDate(item.updatedAt)}`,
  ].filter(Boolean);
  const permanentUrl = cataloguePermanentUrl(item.id, { headers: requestHeaders });

  return (
    <>
      <SiteHeader settings={settings} navItems={navItems} />
      <main>
        <section className="section cat-view" aria-labelledby="cat-view-title">
          <header className="cat-view-head">
            <div className="cat-view-head-main">
              {cataloguesPublic ? (
                <Link className="cat-view-back" href="/catalogues">
                  <span aria-hidden="true">←</span> Back to catalogues
                </Link>
              ) : null}
              <span className={`cat-badge cat-badge-${item.kind}`}>{kindLabel(item.kind)}</span>
              <h1 id="cat-view-title">{item.title}</h1>
              {item.description ? <p className="cat-view-lead">{item.description}</p> : null}
              <p className="cat-view-meta">{meta.join(" · ")}</p>
            </div>
            <div className="cat-view-actions">
              <a className="btn btn-primary" href={item.fileUrl} download={item.fileName}>
                Download
              </a>
              <CatalogueShareButton id={item.id} title={item.title} permanentUrl={permanentUrl} />
              <a className="btn btn-ghost" href={item.fileUrl} target="_blank" rel="noreferrer">
                Open in new tab
              </a>
            </div>
          </header>

          <CatalogueViewer
            title={item.title}
            fileUrl={item.fileUrl}
            fileName={item.fileName}
            isPdf={isPdf}
            thumbUrl={thumbUrl}
          />
        </section>
      </main>
      <SiteFooter footer={footer} />
    </>
  );
}
