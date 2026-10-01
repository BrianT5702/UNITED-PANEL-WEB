/** Small helpers for the analytics ingest: user-agent parsing, bots, referrer source, country. */

export type DeviceType = "desktop" | "mobile" | "tablet";

const BOT_RE =
  /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|headless|lighthouse|pagespeed|gtmetrix|pingdom|uptime|monitor|curl\/|wget|python-requests|python-urllib|node-fetch|axios|go-http|java\/|libwww|scrapy|httpclient|phantomjs|selenium|puppeteer|playwright|validator|check_http|datadog|statuscake|embedly|preview|whatsapp\/|telegrambot|discord/i;

export function isBotUserAgent(ua: string | null | undefined): boolean {
  if (!ua || ua.length < 12) return true;
  return BOT_RE.test(ua);
}

export function parseUserAgent(
  ua: string,
  opts: { touchPoints?: number } = {},
): { browser: string; os: string; device: DeviceType } {
  let browser = "Other";
  if (/Edg(e|A|iOS)?\//.test(ua)) browser = "Edge";
  else if (/OPR\/|Opera/.test(ua)) browser = "Opera";
  else if (/SamsungBrowser/.test(ua)) browser = "Samsung Internet";
  else if (/Firefox\/|FxiOS/.test(ua)) browser = "Firefox";
  else if (/CriOS|Chrome\//.test(ua)) browser = "Chrome";
  else if (/Safari\//.test(ua) && /Version\//.test(ua)) browser = "Safari";
  else if (/MSIE |Trident\//.test(ua)) browser = "Internet Explorer";

  let os = "Other";
  if (/Windows NT/.test(ua)) os = "Windows";
  else if (/iPhone|iPad|iPod/.test(ua)) os = "iOS";
  else if (/Android/.test(ua)) os = "Android";
  else if (/CrOS/.test(ua)) os = "ChromeOS";
  else if (/Mac OS X|Macintosh/.test(ua)) os = (opts.touchPoints ?? 0) > 1 ? "iOS" : "macOS";
  else if (/Linux|X11/.test(ua)) os = "Linux";

  let device: DeviceType = "desktop";
  if (/iPad|Tablet/.test(ua) || (/Android/.test(ua) && !/Mobile/.test(ua))) device = "tablet";
  else if (/Mobi|iPhone|iPod|Android/.test(ua)) device = "mobile";
  else if (os === "iOS" && (opts.touchPoints ?? 0) > 1) device = "tablet"; // iPadOS pretending to be a Mac

  return { browser, os, device };
}

const SEARCH = /(^|\.)(google|bing|yahoo|duckduckgo|baidu|yandex|ecosia|startpage|naver|seznam|qwant|brave)\./i;
const SOCIAL =
  /(^|\.)(facebook|fb|instagram|linkedin|lnkd|twitter|t|x|youtube|youtu|tiktok|pinterest|reddit|telegram|t\.me|wechat|weixin|whatsapp|wa|line|threads|snapchat)\.(com|me|co|in|net|cn|be|ly)$/i;

export type SourceInfo = {
  source: "direct" | "search" | "social" | "email" | "campaign" | "referral";
  sourceName: string | null;
  refHost: string | null;
};

export function hostFromUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.hostname.replace(/^www\./i, "").toLowerCase().slice(0, 120) || null;
  } catch {
    return null;
  }
}

/** Decide where a visit came from. Own-site referrers count as "direct" for a new visit. */
export function classifySource(input: {
  referrer?: string | null;
  selfHost?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
}): SourceInfo {
  const refHost = hostFromUrl(input.referrer);
  const self = (input.selfHost || "").replace(/^www\./i, "").replace(/:\d+$/, "").toLowerCase();
  const external = refHost && refHost !== self ? refHost : null;
  const utmSource = input.utmSource?.trim().toLowerCase() || null;
  const utmMedium = input.utmMedium?.trim().toLowerCase() || null;

  if (utmSource || utmMedium) {
    if (utmMedium && /^(e-?mail|newsletter)$/.test(utmMedium)) {
      return { source: "email", sourceName: utmSource || "email", refHost: external };
    }
    if (utmMedium && /^(social|social-?media|sm)$/.test(utmMedium)) {
      return { source: "social", sourceName: utmSource || external, refHost: external };
    }
    return { source: "campaign", sourceName: utmSource || utmMedium, refHost: external };
  }
  if (!external) return { source: "direct", sourceName: null, refHost: null };
  if (SEARCH.test(external)) return { source: "search", sourceName: external, refHost: external };
  if (SOCIAL.test(external)) return { source: "social", sourceName: external, refHost: external };
  return { source: "referral", sourceName: external, refHost: external };
}

const COUNTRY_HEADERS = [
  "cf-ipcountry",
  "x-vercel-ip-country",
  "cloudfront-viewer-country",
  "x-appengine-country",
  "x-country-code",
  "x-geo-country",
];

/** Two-letter country code from a host/CDN header, or "Unknown". (The offline IP lookup lives in geoip.ts and is only a fallback.) */
export function countryFromHeaders(get: (name: string) => string | null): string {
  for (const name of COUNTRY_HEADERS) {
    const v = get(name)?.trim().toUpperCase();
    if (v && /^[A-Z]{2}$/.test(v) && v !== "XX" && v !== "T1") return v;
  }
  return "Unknown";
}
