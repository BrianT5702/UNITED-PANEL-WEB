import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { ensureSeeded, getHomeContent } from "@/lib/content";
import { VisualHomeEditor } from "@/components/admin/VisualHomeEditor";

export const dynamic = "force-dynamic";

export default async function VisualEditPage() {
  if (!(await isAuthenticated())) {
    redirect("/admin/login");
  }
  await ensureSeeded();
  const content = await getHomeContent();

  return (
    <div className="admin-body">
      <VisualHomeEditor initial={content} />
    </div>
  );
}
