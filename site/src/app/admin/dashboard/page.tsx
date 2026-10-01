import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Analytics dashboard | United Panel-System admin",
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage() {
  if (!(await isAuthenticated())) {
    redirect("/admin/login");
  }
  return (
    <div className="admin-body">
      <AnalyticsDashboard />
    </div>
  );
}
