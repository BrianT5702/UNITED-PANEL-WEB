"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export function AdminEditBarClient({ editHref }: { editHref: string }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <div className="admin-edit-bar" role="region" aria-label="Admin editing">
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
