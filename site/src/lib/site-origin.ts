/** Anything with request headers: a Request, or `{ headers: await headers() }` in a server component */
type HasHeaders = { headers: { get(name: string): string | null } };

/**
 * Absolute site origin for permanent QR / share links.
 * Prefer env; fall back to request Host when generating in an API route.
 */
export function getSiteOrigin(request?: HasHeaders): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.SITE_URL?.trim() ||
    "";
  if (fromEnv) {
    return fromEnv.replace(/\/+$/, "");
  }
  if (request) {
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
    if (host) {
      const proto =
        request.headers.get("x-forwarded-proto") ||
        (host.includes("localhost") || host.startsWith("127.") ? "http" : "https");
      return `${proto}://${host}`.replace(/\/+$/, "");
    }
  }
  return "http://localhost:3000";
}

/** Permanent public landing URL encoded in QR codes — never use title slugs */
export function cataloguePermanentPath(id: string): string {
  return `/r/${id}`;
}

export function cataloguePermanentUrl(id: string, request?: HasHeaders): string {
  return `${getSiteOrigin(request)}${cataloguePermanentPath(id)}`;
}
