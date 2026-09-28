import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { CataloguesManager } from "@/components/admin/CataloguesManager";

export const dynamic = "force-dynamic";

export default async function AdminCataloguesPage() {
  if (!(await isAuthenticated())) {
    redirect("/admin/login");
  }
  return (
    <div className="admin-body">
      <CataloguesManager />
    </div>
  );
}
