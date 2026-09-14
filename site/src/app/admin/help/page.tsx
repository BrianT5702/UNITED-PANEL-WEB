import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { AdminGuide } from "@/components/admin/AdminGuide";

export const dynamic = "force-dynamic";

export default async function AdminHelpPage() {
  if (!(await isAuthenticated())) {
    redirect("/admin/login");
  }

  return (
    <div className="admin-body">
      <AdminGuide variant="page" />
    </div>
  );
}
