"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { CatalogueShareButton } from "./CatalogueShareButton";

export type LibraryItem = {
  id: string;
  title: string;
  kind: "catalogue" | "brochure";
  description: string | null;
  fileUrl: string;
  fileName: string;
  isImage: boolean;
  /** First-page preview image (PDFs), cache-busted — null when not generated */
  thumbUrl: string | null;
  /** e.g. "PDF" */
  fileType: string;
  /** e.g. "2.4 MB" — null when unknown */
  fileSize: string | null;
  /** Pre-formatted on the server (avoids timezone hydration mismatches) */
  updated: string;
  permanentUrl: string;
};

type Filter = "all" | "catalogue" | "brochure";

const KIND_LABEL: Record<LibraryItem["kind"], string> = {
  catalogue: "Catalogue",
  brochure: "Brochure",
};

function DocIcon({ label }: { label: string }) {
  return (
    <svg className="cat-card-doc" viewBox="0 0 64 80" aria-hidden="true">
      <path
        d="M8 2h34l20 20v50a6 6 0 0 1-6 6H8a6 6 0 0 1-6-6V8a6 6 0 0 1 6-6z"
        fill="rgba(255,255,255,0.96)"
      />
      <path d="M42 2v14a6 6 0 0 0 6 6h14z" fill="rgba(0,0,0,0.14)" />
      <rect x="12" y="32" width="30" height="3.5" rx="1.75" fill="rgba(20,24,31,0.16)" />
      <rect x="12" y="40" width="40" height="3.5" rx="1.75" fill="rgba(20,24,31,0.16)" />
      <rect x="12" y="48" width="24" height="3.5" rx="1.75" fill="rgba(20,24,31,0.16)" />
      <rect x="12" y="58" width="28" height="13" rx="3" fill="#c41230" />
      <text
        x="26"
        y="67.6"
        textAnchor="middle"
        fontSize="8.5"
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
        fill="#fff"
      >
        {label.slice(0, 4)}
      </text>
    </svg>
  );
}

/** First-page preview; tells the parent if the image can't be loaded */
function CoverThumb({ src, onFail }: { src: string; onFail: () => void }) {
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    // The image may have failed before React hydrated (onError not attached yet)
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) onFail();
  }, [onFail]);
  return (
    <span className="cat-card-page">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={ref} src={src} alt="" loading="lazy" decoding="async" onError={onFail} />
    </span>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M12 4v11m0 0l-4.5-4.5M12 15l4.5-4.5M5 19h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EmptyIcon() {
  return (
    <svg viewBox="0 0 48 48" width="44" height="44" aria-hidden="true">
      <path
        d="M14 6h14l10 10v24a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M28 6v8a2 2 0 0 0 2 2h8M17 25h14M17 31h10"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CatalogueLibrary({
  items,
  isAdmin,
}: {
  items: LibraryItem[];
  isAdmin: boolean;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  // Previews that couldn't be loaded → show the designed cover instead
  const [failedThumbs, setFailedThumbs] = useState<Set<string>>(() => new Set());
  const failHandlers = useMemo(() => {
    const map = new Map<string, () => void>();
    for (const item of items) {
      map.set(item.id, () =>
        setFailedThumbs((prev) => (prev.has(item.id) ? prev : new Set(prev).add(item.id))),
      );
    }
    return map;
  }, [items]);

  const counts = useMemo(
    () => ({
      all: items.length,
      catalogue: items.filter((i) => i.kind === "catalogue").length,
      brochure: items.filter((i) => i.kind === "brochure").length,
    }),
    [items],
  );
  const showTabs = counts.catalogue > 0 && counts.brochure > 0;
  const visible = showTabs && filter !== "all" ? items.filter((i) => i.kind === filter) : items;

  const adminLink = isAdmin ? (
    <Link className="cat-lib-admin" href="/admin/catalogues">
      <span className="cat-lib-admin-tag">Admin</span>
      Manage catalogues
      <span aria-hidden="true">→</span>
    </Link>
  ) : null;

  if (items.length === 0) {
    return (
      <>
        {adminLink ? <div className="cat-lib-toolbar cat-lib-toolbar-end">{adminLink}</div> : null}
        <div className="cat-lib-empty">
          <span className="cat-lib-empty-icon">
            <EmptyIcon />
          </span>
          <h2>No documents published yet</h2>
          {isAdmin ? (
            <p>
              Upload a PDF catalogue or brochure and it will appear here with its own QR code.{" "}
              <Link href="/admin/catalogues">Upload your first document →</Link>
            </p>
          ) : (
            <p>
              Our catalogues and brochures will be available here soon. Need product information
              now? <Link href="/contact">Contact our team</Link>.
            </p>
          )}
        </div>
      </>
    );
  }

  const tabs: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "catalogue", label: "Catalogues" },
    { key: "brochure", label: "Brochures" },
  ];

  return (
    <>
      <div className="cat-lib-toolbar">
        {showTabs ? (
          <div className="cat-lib-tabs" role="group" aria-label="Filter documents">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                className="cat-lib-tab"
                aria-pressed={filter === t.key}
                onClick={() => setFilter(t.key)}
              >
                {t.label}
                <span className="cat-lib-tab-count">{counts[t.key]}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="cat-lib-count">
            {items.length} {items.length === 1 ? "document" : "documents"}
          </p>
        )}
        {adminLink}
      </div>

      <ul className={`cat-lib-grid${visible.length >= 4 ? " cat-lib-grid-wide" : ""}`}>
        {visible.map((item) => {
          const meta = [item.fileType, item.fileSize, `Updated ${item.updated}`].filter(Boolean);
          const thumb = item.thumbUrl && !failedThumbs.has(item.id) ? item.thumbUrl : null;
          return (
            <li key={item.id} className="cat-card">
              <Link
                href={`/r/${item.id}`}
                className={`cat-card-cover cat-card-cover-${item.kind}${
                  thumb ? " has-thumb" : item.isImage ? " has-image" : ""
                }`}
                tabIndex={-1}
                aria-hidden="true"
              >
                {thumb ? (
                  <CoverThumb src={thumb} onFail={failHandlers.get(item.id)!} />
                ) : item.isImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.fileUrl} alt="" loading="lazy" />
                ) : (
                  <DocIcon label={item.fileType} />
                )}
                <span className="cat-card-kind">{KIND_LABEL[item.kind]}</span>
                <span className="cat-card-type">{item.fileType}</span>
              </Link>

              <div className="cat-card-body">
                <h2 className="cat-card-title">{item.title}</h2>
                {item.description ? <p className="cat-card-desc">{item.description}</p> : null}
                <p className="cat-card-meta">
                  {meta.map((m, i) => (
                    <span key={i}>{m}</span>
                  ))}
                </p>
              </div>

              <div className="cat-card-actions">
                <Link className="cat-card-btn cat-card-btn-primary" href={`/r/${item.id}`}>
                  Open
                </Link>
                <a
                  className="cat-card-btn cat-card-btn-icon"
                  href={item.fileUrl}
                  download={item.fileName}
                  aria-label={`Download ${item.title}`}
                  title="Download"
                >
                  <DownloadIcon />
                </a>
                <CatalogueShareButton
                  id={item.id}
                  title={item.title}
                  permanentUrl={item.permanentUrl}
                  iconOnly
                />
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
