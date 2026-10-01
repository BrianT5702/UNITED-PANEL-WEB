import type { FooterContent } from "@/lib/types";
import { footerCopyText } from "@/lib/footer-text";

/** Two lines: the page label, then the company name followed by the copyright text. */
export function SiteFooter({ footer }: { footer: FooterContent }) {
  const year = new Date().getFullYear();
  const copyright = footerCopyText(footer.copyright, footer.companyName).replace(
    "{year}",
    String(year),
  );

  return (
    <footer className="site-footer">
      <p className="footer-page">{footer.tagline}</p>
      <p className="footer-legal">
        <strong className="footer-name">{footer.companyName}</strong>
        <span className="footer-dot">{" · "}</span>
        <span className="footer-copy">{copyright}</span>
      </p>
      {footer.note ? <p className="footer-note">{footer.note}</p> : null}
    </footer>
  );
}
