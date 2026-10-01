/**
 * The footer shows the company name once, in bold, on the same line as the copyright text.
 * Older saved copyright texts still contain the company name ("All Rights Reserved. {year}
 * United Panel-System(M) Sdn Bhd. (772009-A)"), so strip it at display time to avoid repeating it.
 */
export function footerCopyText(copyright: string, companyName: string): string {
  const name = companyName.trim();
  if (!name) return copyright;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const stripped = copyright.replace(new RegExp(`\\s*${escaped}`, "i"), "");
  return stripped.replace(/\s{2,}/g, " ").trim();
}
