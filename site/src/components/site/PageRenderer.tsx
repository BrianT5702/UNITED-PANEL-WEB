import type { PageDocument } from "@/lib/page-document";
import type { NavItem } from "@/lib/types";
import { defaultHomeContent } from "@/lib/defaults";
import { SITE_NAV } from "@/lib/nav";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { AboutShell } from "./AboutShell";
import { SectionView } from "./SectionView";

export function PageRenderer({
  document,
  navItems = SITE_NAV,
}: {
  document: PageDocument;
  navItems?: NavItem[];
}) {
  const settings = defaultHomeContent.settings;
  const footer = {
    ...defaultHomeContent.footer,
    tagline: document.title,
  };

  const main = (
    <>
      {document.sections
        .filter((s) => s.visible !== false)
        .map((section) => (
          <SectionView key={section.id} section={section} />
        ))}
    </>
  );

  if (document.chrome === "about" && document.about) {
    return (
      <AboutShell
        title={document.title}
        crumbs={document.about.crumbs}
        activeHref={document.about.activeHref}
        image={document.about.image}
        eyebrow={document.about.eyebrow || "About Us"}
        brand={document.about.brand}
        lead={document.about.lead}
        navItems={navItems}
      >
        {main}
      </AboutShell>
    );
  }

  if (document.chrome === "none") {
    return <main>{main}</main>;
  }

  return (
    <>
      <SiteHeader settings={settings} navItems={navItems} />
      <main>{main}</main>
      <SiteFooter footer={footer} />
    </>
  );
}
