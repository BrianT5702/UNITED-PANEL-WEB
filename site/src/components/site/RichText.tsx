import {
  isRichHtml,
  toDisplayHtml,
} from "@/lib/sanitize-html";

type Intrinsic =
  | "div"
  | "p"
  | "span"
  | "h1"
  | "h2"
  | "h3"
  | "strong"
  | "section";

/**
 * Live render for CMS text that may be plain or sanitized rich HTML.
 * - Plain + paragraphs: blank-line → <p>; single Enter (\n) → <br>
 * - Plain + !paragraphs: single element with \n → <br>
 * - Rich: sanitized HTML; literal newlines normalized to <br>
 *
 * Enter breaks from the admin editor must show on the live page. We emit <br>
 * rather than relying only on white-space: pre-wrap/pre-line.
 */
export function RichText({
  text,
  className,
  as: Tag = "div",
  paragraphs = false,
}: {
  text: string;
  className?: string;
  as?: Intrinsic;
  /** When plain, split on blank lines into <p>s (like legacy Paragraphs). */
  paragraphs?: boolean;
}) {
  if (!text) return null;

  if (!isRichHtml(text)) {
    if (paragraphs) {
      return (
        <>
          {text.split(/\n\n+/).map((block, i) => (
            <p
              key={i}
              className={className}
              dangerouslySetInnerHTML={{ __html: toDisplayHtml(block) }}
            />
          ))}
        </>
      );
    }
    return (
      <Tag
        className={className}
        dangerouslySetInnerHTML={{ __html: toDisplayHtml(text) }}
      />
    );
  }

  const safe = toDisplayHtml(text);
  // Block HTML may include <p>/<div>/<ul>/<ol> — avoid nesting inside <p>/phrasing tags
  const hasBlockTags = /<(?:p|div|ul|ol)\b/i.test(safe);
  const phrasing = Tag === "span" || Tag === "strong";
  const Wrapper: Intrinsic =
    paragraphs || Tag === "p" || (phrasing && hasBlockTags) ? "div" : Tag;
  const cls = ["rich-text", className].filter(Boolean).join(" ");
  return <Wrapper className={cls} dangerouslySetInnerHTML={{ __html: safe }} />;
}
