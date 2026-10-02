import type { ReactNode } from "react";

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

/** Contact row value → links for emails, phone numbers (+60…) and websites. Plain text otherwise. */
export function ContactValue({ label, value }: { label: string; value: string }): ReactNode {
  const text = value || "";
  if (!text.trim()) return null;

  if (/web|site|url|link/i.test(label)) {
    const t = text.trim();
    if (/^https?:\/\//i.test(t) || /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(t)) {
      const href = /^https?:\/\//i.test(t) ? t : `http://${t}`;
      return (
        <a href={href} target="_blank" rel="noreferrer">
          {t}
        </a>
      );
    }
    return text;
  }

  if (/tel|phone|mobile|whatsapp|hotline/i.test(label) && !/fax|facsim/i.test(label)) {
    return text.split(/(\s*\/\s*)/).map((part, i) => {
      const t = part.trim();
      if (/^\+[\d\s()-]{6,}$/.test(t)) {
        return (
          <a key={i} href={`tel:${t.replace(/[^\d+]/g, "")}`}>
            {t}
          </a>
        );
      }
      return <span key={i}>{part}</span>;
    });
  }

  const nodes: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(EMAIL_RE)) {
    const at = m.index ?? 0;
    if (at > last) nodes.push(text.slice(last, at));
    nodes.push(
      <a key={at} href={`mailto:${m[0]}`}>
        {m[0]}
      </a>,
    );
    last = at + m[0].length;
  }
  if (!nodes.length) return text;
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}
