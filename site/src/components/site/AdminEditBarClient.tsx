"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

const HTML_CLASS = "has-admin-edit-bar";

export function AdminEditBarClient({ editHref }: { editHref: string }) {
  const router = useRouter();
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add(HTML_CLASS);

    const el = barRef.current;
    const applyHeight = () => {
      const h = el?.offsetHeight || 42;
      root.style.setProperty("--admin-edit-bar-h", `${h}px`);
    };
    applyHeight();

    const ro = el && typeof ResizeObserver !== "undefined" ? new ResizeObserver(applyHeight) : null;
    if (el && ro) ro.observe(el);
    window.addEventListener("resize", applyHeight);

    return () => {
      root.classList.remove(HTML_CLASS);
      root.style.removeProperty("--admin-edit-bar-h");
      window.removeEventListener("resize", applyHeight);
      ro?.disconnect();
    };
  }, []);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <div ref={barRef} className="admin-edit-bar" role="region" aria-label="Admin editing">
      <div className="admin-edit-bar-inner">
        <div className="admin-edit-bar-copy">
          <span className="admin-edit-bar-label">Editing mode</span>
          <span className="admin-edit-bar-hint">Only signed-in editors see this bar.</span>
        </div>
        <div className="admin-edit-bar-actions">
          <Link className="admin-edit-bar-btn is-primary" href={editHref}>
            Edit this page
          </Link>
          <Link className="admin-edit-bar-btn" href="/admin/edit">
            All pages
          </Link>
          <Link className="admin-edit-bar-btn is-dashboard" href="/admin/dashboard" title="See visitor statistics">
            Dashboard
          </Link>
          <Link className="admin-edit-bar-btn" href="/admin/guide">
            Help
          </Link>
          <button type="button" className="admin-edit-bar-btn is-quiet" onClick={logout}>
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}
