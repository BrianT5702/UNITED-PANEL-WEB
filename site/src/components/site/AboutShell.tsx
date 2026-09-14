import Link from "next/link";
import type { ReactNode } from "react";
import type { NavItem } from "@/lib/types";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SITE_NAV } from "@/lib/nav";
import { AboutSideNav } from "./AboutSideNav";

export { ABOUT_NAV } from "./AboutSideNav";
export type { AboutNavItem } from "./AboutSideNav";

const settings = {
  logoUrl: "https://www.ur.com.my/images/logo-2.png",
  siteName: "United Panel-System",
};

const footer = {
  companyName: "United Panel-System(M) Sdn Bhd",
  tagline: "About Us",
  copyright: "All Rights Reserved. {year} United Panel-System(M) Sdn Bhd. (772009-A)",
  note: "",
};

export function AboutShell({
  title,
  crumbs,
  activeHref,
  image = "https://www.ur.com.my/userfiles/image/newfactoryoutlok.png",
  eyebrow = "About Us",
  brand,
  lead,
  children,
  mapHref,
  mediaSlot,
  brandSlot,
  eyebrowSlot,
  titleSlot,
  leadSlot,
  heroLabel,
  navItems: navItemsProp,
}: {
  title: string;
  crumbs: { label: string; href?: string }[];
  activeHref: string;
  image?: string;
  eyebrow?: string;
  brand?: string;
  lead?: string;
  children: ReactNode;
  /** Rewrite internal links (used by admin edit mode) */
  mapHref?: (href: string) => string;
  /** Optional editable replacements for the banner */
  mediaSlot?: ReactNode;
  brandSlot?: ReactNode;
  eyebrowSlot?: ReactNode;
  titleSlot?: ReactNode;
  leadSlot?: ReactNode;
  heroLabel?: ReactNode;
  /** Top bar menu (CMS). Falls back to default SITE_NAV. */
  navItems?: NavItem[];
}) {
  const href = (h: string) => (mapHref ? mapHref(h) : h);
  const sourceNav = navItemsProp?.length ? navItemsProp : SITE_NAV;
  const navItems = sourceNav.map((item) => ({
    ...item,
    href: href(item.href),
    children: item.children?.map((child) => ({ ...child, href: href(child.href) })),
  }));
  const editing = Boolean(mediaSlot || brandSlot || eyebrowSlot || titleSlot || leadSlot);

  return (
    <>
      <SiteHeader settings={settings} navItems={navItems} brandHref={href("/")} />
      <main className="about-page">
        <div className={`about-hero${editing ? " ve-about-hero" : ""}`}>
          {heroLabel}
          <div className="about-hero-media" aria-hidden="true">
            {mediaSlot || (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt="" />
                <div className="about-hero-veil" />
              </>
            )}
          </div>
          <div className="about-hero-inner">
            {brandSlot || (brand ? <p className="hero-brand">{brand}</p> : null)}
            {eyebrowSlot || <p className="eyebrow">{eyebrow}</p>}
            {titleSlot || <h1>{title}</h1>}
            {leadSlot || (lead ? <p className="about-hero-lead">{lead}</p> : null)}
            <nav className="about-crumbs" aria-label="Breadcrumb">
              <Link href={href("/")}>Home</Link>
              <span>/</span>
              <Link href={href("/about")}>{eyebrow || "About Us"}</Link>
              {crumbs.map((c) => (
                <span key={c.label} className="about-crumb-item">
                  <span>/</span>
                  {c.href ? <Link href={href(c.href)}>{c.label}</Link> : <span>{c.label}</span>}
                </span>
              ))}
            </nav>
          </div>
        </div>

        <div className="about-layout">
          <AboutSideNav activeHref={activeHref} mapHref={mapHref} />

          <article className="about-content">{children}</article>
        </div>
      </main>
      <SiteFooter footer={footer} />
    </>
  );
}
