import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { ensureSeeded } from "@/lib/content";
import { HOME_SECTION_KEYS, SECTION_LABELS } from "@/lib/types";
import { LogoutButton } from "@/components/admin/LogoutButton";

export default async function AdminAdvancedPage() {
  if (!(await isAuthenticated())) {
    redirect("/admin/login");
  }
  await ensureSeeded();

  return (
    <div className="admin-body">
      <div className="admin-shell">
        <div className="admin-header">
          <div>
            <p className="eyebrow">Advanced</p>
            <h1>Form editors</h1>
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <a className="btn btn-primary" href="/admin/edit">
              Visual editor
            </a>
            <LogoutButton />
          </div>
        </div>
        <p style={{ color: "var(--muted)", marginBottom: "1.25rem" }}>
          Optional form-based editing. Most users should use the visual editor instead.
        </p>
        <div className="admin-card-list">
          {HOME_SECTION_KEYS.map((key) => (
            <a className="admin-card" href={`/admin/sections/${key}`} key={key}>
              <div>
                <strong>{SECTION_LABELS[key]}</strong>
                <div style={{ color: "var(--steel)", fontSize: "0.85rem" }}>{key}</div>
              </div>
              <span style={{ color: "var(--accent)" }}>Edit →</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
