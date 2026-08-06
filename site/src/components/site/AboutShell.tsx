import Link from "next/link";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SITE_NAV } from "@/lib/nav";

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

export type AboutNavItem = {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
};

export const ABOUT_NAV: AboutNavItem[] = [
  { label: "Company Profile", href: "/about/company-profile" },
  { label: "Vision & Mission", href: "/about/vision-mission" },
  { label: "Research & Development", href: "/about/research-development" },
  {
    label: "Certified, Recognized and Approved",
    href: "/about/certified",
    children: [
      { label: "FM Global Approval", href: "/about/certified/fm-global" },
      { label: "TÜV Fire Classification", href: "/about/certified/tuv" },
      { label: "ISO, SIRIM & Bomba", href: "/about/certified/quality-recognition" },
    ],
  },
];

export function AboutShell({
  title,
  crumbs,
  activeHref,
  image = "https://www.ur.com.my/userfiles/image/newfactoryoutlok.png",
  children,
}: {
  title: string;
  crumbs: { label: string; href?: string }[];
  activeHref: string;
  image?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader settings={settings} navItems={SITE_NAV} />
      <main className="about-page">
        <div className="about-hero">
          <div className="about-hero-media" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="" />
            <div className="about-hero-veil" />
          </div>
          <div className="about-hero-inner">
            <p className="eyebrow">About Us</p>
            <h1>{title}</h1>
            <nav className="about-crumbs" aria-label="Breadcrumb">
              <Link href="/">Home</Link>
              <span>/</span>
              <Link href="/about">About Us</Link>
              {crumbs.map((c) => (
                <span key={c.label} className="about-crumb-item">
                  <span>/</span>
                  {c.href ? <Link href={c.href}>{c.label}</Link> : <span>{c.label}</span>}
                </span>
              ))}
            </nav>
          </div>
        </div>

        <div className="about-layout">
          <aside className="about-side" aria-label="About sections">
            <p className="about-side-title">About Us</p>
            <ul className="about-side-nav">
              {ABOUT_NAV.map((item) => {
                const active =
                  activeHref === item.href ||
                  item.children?.some((c) => c.href === activeHref) ||
                  (item.href !== "/about" && activeHref.startsWith(`${item.href}/`));
                return (
                  <li key={item.href} className={active ? "is-active" : undefined}>
                    <Link href={item.href}>{item.label}</Link>
                    {item.children ? (
                      <ul>
                        {item.children.map((child) => (
                          <li
                            key={child.href}
                            className={activeHref === child.href ? "is-active" : undefined}
                          >
                            <Link href={child.href}>{child.label}</Link>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </aside>

          <article className="about-content">{children}</article>
        </div>
      </main>
      <SiteFooter footer={footer} />
    </>
  );
}
