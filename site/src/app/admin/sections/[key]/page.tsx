import { notFound, redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { getSection } from "@/lib/content";
import { HOME_SECTION_KEYS, SECTION_LABELS, type HomeSectionKey } from "@/lib/types";
import { SectionEditor } from "@/components/admin/SectionEditor";
import { LogoutButton } from "@/components/admin/LogoutButton";

export default async function AdminSectionPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  if (!(await isAuthenticated())) {
    redirect("/admin/login");
  }

  const { key } = await params;
  if (!(HOME_SECTION_KEYS as readonly string[]).includes(key)) {
    notFound();
  }
  const sectionKey = key as HomeSectionKey;
  const data = await getSection(sectionKey);

  return (
    <div className="admin-body">
      <div className="admin-shell">
        <div className="admin-header">
          <div>
            <p className="eyebrow">Edit section</p>
            <h1>{SECTION_LABELS[sectionKey]}</h1>
          </div>
          <LogoutButton />
        </div>
        <SectionEditor sectionKey={sectionKey} initialData={data} />
      </div>
    </div>
  );
}
