import type { FooterContent } from "@/lib/types";

export function SiteFooter({ footer }: { footer: FooterContent }) {
  const year = new Date().getFullYear();
  const copyright = footer.copyright.replace("{year}", String(year));

  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <strong>{footer.companyName}</strong>
        <span>{footer.tagline}</span>
      </div>
      {footer.note ? <p className="footer-note">{footer.note}</p> : null}
      <p className="footer-copy">{copyright}</p>
    </footer>
  );
}
