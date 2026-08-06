import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { AdminPageSwitcher } from "@/components/admin/AdminPageSwitcher";
import { LogoutButton } from "@/components/admin/LogoutButton";

export default async function EditComingSoon({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  if (!(await isAuthenticated())) {
    redirect("/admin/login");
  }
  const { slug } = await params;
  const label = slug.replace(/-/g, " ");

  return (
    <div className="admin-body">
      <div className="ve-toolbar">
        <div>
          <strong>Visual editor — {label}</strong>
          <AdminPageSwitcher current={`/admin/edit/${slug}`} />
        </div>
        <div className="ve-toolbar-actions">
          <a className="btn btn-ghost" href={`/products/${slug}`} target="_blank" rel="noreferrer">
            View live page
          </a>
          <LogoutButton />
        </div>
      </div>
      <div className="admin-shell" style={{ paddingTop: "5rem" }}>
        <p className="eyebrow">Coming next</p>
        <h1 style={{ maxWidth: "none" }}>Visual editing for {label}</h1>
        <p className="section-lead">
          Use the page switcher above to open <strong>Homepage</strong> or <strong>PIR Panels</strong>,
          which are ready to edit visually. This product page editor will follow the same pattern.
        </p>
        <div className="admin-actions">
          <a className="btn btn-primary" href="/admin/edit">
            Edit Homepage
          </a>
          <a className="btn btn-ghost" href="/admin/edit/pir">
            Edit PIR
          </a>
        </div>
      </div>
    </div>
  );
}
