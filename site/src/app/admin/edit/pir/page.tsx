import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { ensureSeeded, getPirContent } from "@/lib/content";
import { VisualPirEditor } from "@/components/admin/VisualPirEditor";

export const dynamic = "force-dynamic";

export default async function EditPirPage() {
  if (!(await isAuthenticated())) {
    redirect("/admin/login");
  }
  await ensureSeeded();
  const content = await getPirContent();
  return (
    <div className="admin-body">
      <VisualPirEditor initial={content} />
    </div>
  );
}
