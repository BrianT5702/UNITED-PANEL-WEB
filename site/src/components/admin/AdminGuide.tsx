"use client";

import { useEffect, useRef } from "react";
import { ADMIN_GUIDE_CHAPTERS } from "@/lib/admin-guide";

export function AdminGuide({
  open,
  onClose,
  variant = "overlay",
  focusChapter = "start",
}: {
  open?: boolean;
  onClose?: () => void;
  variant?: "overlay" | "page";
  /** Chapter id to scroll into view when the overlay opens */
  focusChapter?: string;
}) {
  const isOverlay = variant === "overlay";
  const visible = !isOverlay || Boolean(open);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOverlay || !open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [isOverlay, open, onClose]);

  useEffect(() => {
    if (!isOverlay || !open || !focusChapter) return;
    // Let the panel mount, then scroll to the chapter
    const t = window.setTimeout(() => {
      const target = bodyRef.current?.querySelector(`#guide-${focusChapter}`);
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
    return () => window.clearTimeout(t);
  }, [isOverlay, open, focusChapter]);

  function jumpTo(id: string) {
    const target = bodyRef.current?.querySelector(`#guide-${id}`);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (!visible) return null;

  const toc = (
    <nav className="ag-toc" aria-label="Help sections">
      {ADMIN_GUIDE_CHAPTERS.map((ch) => (
        <a
          key={ch.id}
          href={`#guide-${ch.id}`}
          onClick={(e) => {
            if (!isOverlay) return;
            e.preventDefault();
            jumpTo(ch.id);
          }}
        >
          {ch.title}
        </a>
      ))}
    </nav>
  );

  const chapters = ADMIN_GUIDE_CHAPTERS.map((ch) => (
    <section key={ch.id} id={`guide-${ch.id}`} className="ag-chapter">
      <h2>{ch.title}</h2>
      {ch.blocks.map((block) => (
        <article key={block.heading} className="ag-block">
          <h3>{block.heading}</h3>
          <p>{block.body}</p>
          {block.effect ? (
            <p className="ag-effect">
              <span>What happens</span>
              {block.effect}
            </p>
          ) : null}
        </article>
      ))}
    </section>
  ));

  const body = (
    <div className="ag-body" ref={bodyRef}>
      {toc}
      {chapters}
    </div>
  );

  if (!isOverlay) {
    return (
      <main className="ag-page">
        <header className="ag-page-head">
          <p className="eyebrow">Admin</p>
          <h1>Help</h1>
          <p className="ag-lead">
            How to change pages, photos, and the menu — and what each action does on the live site.
          </p>
          <div className="ag-page-links">
            <a className="btn btn-primary" href="/admin/edit">
              Open page editor
            </a>
            <a className="btn btn-ghost" href="/admin/nav">
              Website menu
            </a>
            <a className="btn btn-ghost" href="/admin/catalogues">
              Catalogues &amp; brochures
            </a>
          </div>
        </header>
        {body}
      </main>
    );
  }

  return (
    <div className="ag-overlay" role="dialog" aria-modal="true" aria-labelledby="ag-title">
      <button type="button" className="ag-backdrop" aria-label="Close help" onClick={onClose} />
      <aside className="ag-panel">
        <header className="ag-panel-head">
          <div>
            <p className="eyebrow">Admin</p>
            <h1 id="ag-title">Help</h1>
          </div>
          <div className="ag-panel-actions">
            <a className="btn btn-ghost" href="/admin/help">
              Full page
            </a>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Close
            </button>
          </div>
        </header>
        {body}
      </aside>
    </div>
  );
}

export function AdminGuideButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="btn btn-ghost ve-bar-btn" onClick={onClick} title="How to edit this site">
      Help
    </button>
  );
}
