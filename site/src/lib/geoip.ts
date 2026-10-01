import { readFileSync } from "node:fs";
import { isIP } from "node:net";
import path from "node:path";
import { brotliDecompressSync } from "node:zlib";

/**
 * Offline location lookup (no npm package, no network call).
 * Data: DB-IP.com "IP to City Lite", "IP to Country Lite" and "IP to ASN Lite" (CC BY 4.0), pre-built into
 * data/geoip/*.bin by `npm run geoip:update`.
 *
 * PRIVACY: an address is only ever used inside `lookupLocation()` / `lookupCountry()` for the moment of the lookup.
 * It is never stored, never logged and never sent anywhere. Only the country code, state/region name and city name
 * leave this file. If the data files are missing or damaged the lookup quietly falls back (city file -> country file
 * -> "Unknown") and nothing crashes. Files are loaded lazily, on the first lookup of a new visit.
 */

type Table = { n: number; starts: Buffer; codes: Buffer; wide: boolean };
let v4: Table | null | undefined;
let v6: Table | null | undefined;

function load(file: string, magic: string, wide: boolean): Table | null {
  try {
    const buf = readFileSync(path.join(process.cwd(), "data", "geoip", file));
    if (buf.toString("ascii", 0, 4) !== magic) return null;
    const n = buf.readUInt32LE(4);
    const w = wide ? 8 : 4;
    if (buf.length !== 8 + n * w + n * 2) return null;
    return { n, starts: buf.subarray(8, 8 + n * w), codes: buf.subarray(8 + n * w), wide };
  } catch {
    return null;
  }
}

function search(t: Table, key: number | bigint): string | null {
  let lo = 0;
  let hi = t.n - 1;
  let hit = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const s = t.wide ? t.starts.readBigUInt64LE(mid * 8) : t.starts.readUInt32LE(mid * 4);
    if (s <= key) {
      hit = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  if (hit < 0) return null;
  const code = t.codes.toString("ascii", hit * 2, hit * 2 + 2);
  return /^[A-Z]{2}$/.test(code) && code !== "ZZ" ? code : null;
}

function v4ToInt(ip: string): number {
  return ip.split(".").reduce((a, p) => a * 256 + Number(p), 0);
}

function v6Words(ip: string): number[] | null {
  let s = ip.toLowerCase();
  const m = /^(.*:)(\d+\.\d+\.\d+\.\d+)$/.exec(s);
  if (m) {
    const n = v4ToInt(m[2]);
    s = `${m[1]}${Math.floor(n / 65536).toString(16)}:${(n % 65536).toString(16)}`;
  }
  const [a, b] = s.split("::");
  const left = a ? a.split(":") : [];
  const right = b !== undefined && b ? b.split(":") : [];
  const fill = b !== undefined ? 8 - left.length - right.length : 0;
  if (fill < 0 || (b === undefined && left.length !== 8)) return null;
  const w = [...left, ...Array(fill).fill("0"), ...right].map((g) => parseInt(g || "0", 16));
  return w.length === 8 && w.every((x) => Number.isFinite(x)) ? w : null;
}

/** Loopback, private, link-local, CGNAT and other non-public ranges. */
export function isPrivateAddress(ip: string): boolean {
  const kind = isIP(ip);
  if (kind === 4) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 192 && b === 0) || a >= 224
    );
  }
  if (kind === 6) {
    const w = v6Words(ip);
    if (!w) return true;
    if (w.every((x, i) => (i === 7 ? x <= 1 : x === 0))) return true; // :: and ::1
    if ((w[0] & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
    if ((w[0] & 0xffc0) === 0xfe80) return true; // fe80::/10 link local
    if (w[0] === 0 && w[1] === 0 && w[2] === 0 && w[3] === 0 && w[4] === 0 && w[5] === 0xffff) {
      return isPrivateAddress(`${w[6] >> 8}.${w[6] & 255}.${w[7] >> 8}.${w[7] & 255}`);
    }
    return false;
  }
  return true;
}

/** Cleans one address from a header value: strips brackets, ports and IPv4-mapped prefixes. */
function cleanAddress(raw: string): string | null {
  let s = raw.trim();
  if (!s) return null;
  const br = /^\[([^\]]+)\](?::\d+)?$/.exec(s);
  if (br) s = br[1];
  else if (/^\d+\.\d+\.\d+\.\d+:\d+$/.test(s)) s = s.slice(0, s.lastIndexOf(":"));
  s = s.replace(/^::ffff:/i, "");
  return isIP(s) ? s : null;
}

export type GeoResult = { code: string } | { local: true } | null;

/**
 * Country for the visitor behind these request headers.
 * Returns a country code, { local: true } for private/loopback addresses, or null when nothing usable was found.
 */
export function lookupCountry(header: (name: string) => string | null): GeoResult {
  if (process.env.ANALYTICS_GEOIP === "0") return null;
  const a = visitorAddress(header);
  if (!a) return null;
  if ("local" in a) return { local: true };
  const pub = a.ip;
  try {
    if (isIP(pub) === 4) {
      if (v4 === undefined) v4 = load("country-v4.bin", "GEO4", false);
      const code = v4 ? search(v4, v4ToInt(pub)) : null;
      return code ? { code } : null;
    }
    if (v6 === undefined) v6 = load("country-v6.bin", "GEO6", true);
    const w = v6Words(pub);
    if (!v6 || !w) return null;
    const top = (BigInt(w[0]) << BigInt(48)) | (BigInt(w[1]) << BigInt(32)) | (BigInt(w[2]) << BigInt(16)) | BigInt(w[3]);
    const code = search(v6, top);
    return code ? { code } : null;
  } catch {
    return null;
  }
}

/* ───────────── city / state level (data/geoip/city.bin, loaded lazily) ───────────── */
type CityDb = {
  places: [string, string, string][]; // [country, region, city]
  s4: Uint32Array;
  p4: Uint16Array;
  s6: Float64Array; // top 48 bits of the IPv6 address
  p6: Uint16Array;
};
let cityDb: CityDb | null | undefined;

function readVarints(buf: Buffer, count: number, delta: boolean): Float64Array {
  const out = new Float64Array(count);
  let pos = 0;
  let prev = 0;
  for (let i = 0; i < count; i++) {
    let n = 0;
    let mul = 1;
    for (;;) {
      const b = buf[pos++];
      n += (b & 127) * mul;
      if (b < 128) break;
      mul *= 128;
    }
    prev = delta ? prev + n : n;
    out[i] = prev;
  }
  return out;
}

function loadCity(): CityDb | null {
  try {
    const raw = brotliDecompressSync(readFileSync(path.join(process.cwd(), "data", "geoip", "city.bin")));
    if (raw.toString("ascii", 0, 4) !== "GCT1") return null;
    const jsonLen = raw.readUInt32LE(4);
    const n4 = raw.readUInt32LE(8);
    const a4 = raw.readUInt32LE(12);
    const b4 = raw.readUInt32LE(16);
    const n6 = raw.readUInt32LE(20);
    const a6 = raw.readUInt32LE(24);
    const b6 = raw.readUInt32LE(28);
    let o = 32;
    const places = JSON.parse(raw.toString("utf8", o, o + jsonLen)) as [string, string, string][];
    o += jsonLen;
    const s4 = Uint32Array.from(readVarints(raw.subarray(o, o + a4), n4, true));
    o += a4;
    const p4 = Uint16Array.from(readVarints(raw.subarray(o, o + b4), n4, false));
    o += b4;
    const s6 = readVarints(raw.subarray(o, o + a6), n6, true);
    o += a6;
    const p6 = Uint16Array.from(readVarints(raw.subarray(o, o + b6), n6, false));
    if (!Array.isArray(places) || !n4 || !n6) return null;
    return { places, s4, p4, s6, p6 };
  } catch {
    return null;
  }
}

function searchCity(starts: Uint32Array | Float64Array, key: number): number {
  let lo = 0;
  let hi = starts.length - 1;
  let hit = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (starts[mid] <= key) {
      hit = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return hit;
}

export type GeoPlace = { country: string; region: string | null; city: string | null };

function placeFromCityDb(ip: string): GeoPlace | null {
  if (cityDb === undefined) cityDb = loadCity();
  const db = cityDb;
  if (!db) return null;
  let id = -1;
  if (isIP(ip) === 4) {
    const i = searchCity(db.s4, v4ToInt(ip));
    id = i < 0 ? -1 : db.p4[i];
  } else {
    const w = v6Words(ip);
    if (!w) return null;
    const top48 = w[0] * 4294967296 + w[1] * 65536 + w[2];
    const i = searchCity(db.s6, top48);
    id = i < 0 ? -1 : db.p6[i];
  }
  const p = id < 0 ? null : db.places[id];
  if (!p || !/^[A-Z]{2}$/.test(p[0]) || p[0] === "ZZ") return null;
  return { country: p[0], region: p[1] || null, city: p[2] || null };
}

/** The address of the visitor from the proxy headers: first public one, "local" for private chains, null if none. */
function visitorAddress(header: (name: string) => string | null): { ip: string } | { local: true } | null {
  const candidates: string[] = [];
  if (process.env.ANALYTICS_TRUST_PROXY !== "0") {
    for (const part of (header("x-forwarded-for") || "").split(",")) {
      const a = cleanAddress(part);
      if (a) candidates.push(a);
    }
    const real = cleanAddress(header("x-real-ip") || "");
    if (real) candidates.push(real);
  }
  if (!candidates.length) return null;
  // first public address in the chain (the visitor); if the whole chain is private it is a local visit
  const pub = candidates.find((a) => !isPrivateAddress(a));
  return pub ? { ip: pub } : { local: true };
}

export type LocationResult = ({ local: true } | GeoPlace) | null;

/**
 * Country, state/region and city for the visitor behind these request headers (city file first, country file as
 * the fallback). Returns { local: true } for private/loopback addresses and null when nothing usable was found.
 */
export function lookupLocation(header: (name: string) => string | null): LocationResult {
  if (process.env.ANALYTICS_GEOIP === "0") return null;
  try {
    const a = visitorAddress(header);
    if (!a) return null;
    if ("local" in a) return { local: true };
    const place = placeFromCityDb(a.ip);
    if (place) return place;
    const c = lookupCountry(header);
    return c && "code" in c ? { country: c.code, region: null, city: null } : null;
  } catch {
    return null;
  }
}

/* ───────────── network type (data/geoip/asn.bin, loaded lazily) ───────────── */
/**
 * Which kind of network is the visitor on? Only "mobile" (a mobile carrier) and "hosting" (VPN / data centre) are
 * recognised; ordinary home and office broadband returns null. For these two kinds the state and city from the city
 * file only say where the carrier's or data centre's hub is, not where the person is.
 */
export type NetworkInfo = { kind: "mobile" | "hosting"; carrier: string | null };

type AsnDb = {
  kinds: [string, string][]; // [kind, brand label]
  s4: Float64Array;
  e4: Float64Array;
  k4: Uint16Array;
  s6: Float64Array;
  e6: Float64Array;
  k6: Uint16Array;
};
let asnDb: AsnDb | null | undefined;

function loadAsn(): AsnDb | null {
  try {
    const raw = brotliDecompressSync(readFileSync(path.join(process.cwd(), "data", "geoip", "asn.bin")));
    if (raw.toString("ascii", 0, 4) !== "ASN1") return null;
    const n = (i: number) => raw.readUInt32LE(4 + i * 4);
    const [jl, n4, a4, l4, d4, n6, a6, l6, d6] = [0, 1, 2, 3, 4, 5, 6, 7, 8].map(n);
    let o = 48;
    const kinds = JSON.parse(raw.toString("utf8", o, o + jl)) as [string, string][];
    o += jl;
    const take = (len: number) => {
      const b = raw.subarray(o, o + len);
      o += len;
      return b;
    };
    const s4 = readVarints(take(a4), n4, true);
    const len4 = readVarints(take(l4), n4, false);
    const k4 = Uint16Array.from(readVarints(take(d4), n4, false));
    const s6 = readVarints(take(a6), n6, true);
    const len6 = readVarints(take(l6), n6, false);
    const k6 = Uint16Array.from(readVarints(take(d6), n6, false));
    const e4 = Float64Array.from(len4, (l, i) => s4[i] + l);
    const e6 = Float64Array.from(len6, (l, i) => s6[i] + l);
    if (!Array.isArray(kinds) || !n4) return null;
    return { kinds, s4, e4, k4, s6, e6, k6 };
  } catch {
    return null;
  }
}

function networkOf(ip: string): NetworkInfo | null {
  if (asnDb === undefined) asnDb = loadAsn();
  const db = asnDb;
  if (!db) return null;
  let i: number;
  let kid = -1;
  if (isIP(ip) === 4) {
    const key = v4ToInt(ip);
    i = searchCity(db.s4, key);
    if (i >= 0 && key <= db.e4[i]) kid = db.k4[i];
  } else {
    const w = v6Words(ip);
    if (!w) return null;
    const key = w[0] * 4294967296 + w[1] * 65536 + w[2];
    i = searchCity(db.s6, key);
    if (i >= 0 && key <= db.e6[i]) kid = db.k6[i];
  }
  const k = kid < 0 ? null : db.kinds[kid];
  if (!k || (k[0] !== "mobile" && k[0] !== "hosting")) return null;
  return { kind: k[0], carrier: k[1] || null };
}

/** "mobile" / "hosting" (with the carrier brand when known) for the visitor behind these headers, or null. */
export function lookupNetwork(header: (name: string) => string | null): NetworkInfo | null {
  if (process.env.ANALYTICS_GEOIP === "0") return null;
  try {
    const a = visitorAddress(header);
    if (!a || "local" in a) return null;
    return networkOf(a.ip);
  } catch {
    return null;
  }
}

/** For the dashboard: which offline data is present, and which month is it from? (No addresses involved.) */
export function geoStatus(): { available: boolean; city: boolean; asn: boolean; month: string | null } {
  try {
    if (process.env.ANALYTICS_GEOIP === "0") return { available: false, city: false, asn: false, month: null };
    if (v4 === undefined) v4 = load("country-v4.bin", "GEO4", false);
    if (cityDb === undefined) cityDb = loadCity();
    if (asnDb === undefined) asnDb = loadAsn();
    let month: string | null = null;
    try {
      month = (JSON.parse(readFileSync(path.join(process.cwd(), "data", "geoip", "meta.json"), "utf8")) as { month?: string }).month || null;
    } catch {
      /* no meta file */
    }
    return { available: !!v4 || !!cityDb, city: !!cityDb, asn: !!asnDb, month };
  } catch {
    return { available: false, city: false, asn: false, month: null };
  }
}
