#!/usr/bin/env node
/**
 * Builds the compact offline location databases used by the analytics (no npm package needed).
 *
 *   npm run geoip:update                      -> downloads the newest free DB-IP files and rebuilds everything
 *   node scripts/geoip-build.mjs --city  f.csv[.gz]   -> rebuild the city file from a CSV you already downloaded
 *   node scripts/geoip-build.mjs --country f.csv[.gz] -> rebuild the country-only file from a CSV you already downloaded
 *   node scripts/geoip-build.mjs f.csv.gz             -> same as --country (the old usage)
 *
 * Data: DB-IP.com "IP to City Lite" and "IP to Country Lite", CC BY 4.0
 * (attribution: "IP Geolocation by DB-IP", https://db-ip.com).
 *
 * Output (committed to the repo), all in data/geoip/:
 *   country-v4.bin, country-v6.bin   country only (~5 MB) - the fallback when the city file is missing
 *   city.bin                         country + state/region + city (brotli, a few MB)
 *   meta.json                        data month and counts
 *
 * Size control: the city file keeps CITY detail for the countries in CITY_COUNTRIES (Malaysia and its neighbours),
 * STATE detail for the rest of the world, and merges neighbouring ranges that give the same answer.
 * IPv6 is stored at /48 precision, which is plenty for a city lookup.
 *
 * Only Node built-ins are used. The CSV is streamed, so the 700 MB city file never sits in memory as one string.
 */
import { createGunzip, brotliCompressSync, constants as zc } from "node:zlib";
import { createReadStream, readFileSync, writeFileSync, mkdirSync, existsSync, createWriteStream } from "node:fs";
import { createInterface } from "node:readline";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { isIP } from "node:net";
import os from "node:os";
import path from "node:path";

const OUT = path.join(process.cwd(), "data", "geoip");
/** Countries that keep city level detail; everywhere else is country + state/region only. */
const CITY_COUNTRIES = new Set(["MY", "SG", "BN", "ID", "TH", "VN", "PH", "KH", "LA", "MM", "TL", "HK", "TW", "AU", "NZ", "IN", "CN", "JP", "KR"]);

/* ───────────── name clean-up (the lookup applies the same rules, see src/lib/geoip.ts) ───────────── */
const MY_STATES = {
  "johore": "Johor", "johor": "Johor", "johor darul takzim": "Johor",
  "kedah": "Kedah", "kedah darul aman": "Kedah",
  "kelantan": "Kelantan", "kelantan darul naim": "Kelantan",
  "malacca": "Melaka", "melaka": "Melaka",
  "negeri sembilan": "Negeri Sembilan", "negri sembilan": "Negeri Sembilan",
  "pahang": "Pahang", "pahang darul makmur": "Pahang",
  "penang": "Penang", "pulau pinang": "Penang", "prai": "Penang",
  "perak": "Perak", "perak darul ridzuan": "Perak",
  "perlis": "Perlis", "perlis indera kayangan": "Perlis",
  "sabah": "Sabah", "sarawak": "Sarawak",
  "selangor": "Selangor", "selangor darul ehsan": "Selangor",
  "terengganu": "Terengganu", "trengganu": "Terengganu", "terengganu darul iman": "Terengganu",
  "kuala lumpur": "Kuala Lumpur", "federal territory of kuala lumpur": "Kuala Lumpur", "wilayah persekutuan kuala lumpur": "Kuala Lumpur",
  "putrajaya": "Putrajaya", "federal territory of putrajaya": "Putrajaya", "wilayah persekutuan putrajaya": "Putrajaya",
  "labuan": "Labuan", "federal territory of labuan": "Labuan", "wilayah persekutuan labuan": "Labuan",
};
const MY_CITY_FIX = { malacca: "Melaka", "johore bahru": "Johor Bahru", "georgetown": "George Town", "penang": "George Town" };
function cleanName(s) {
  return (s || "").replace(/\s*\([^)]*\)\s*$/, "").replace(/\s+/g, " ").trim().slice(0, 60);
}
function normRegion(cc, s) {
  const r = cleanName(s);
  if (cc === "MY") {
    const k = r.toLowerCase();
    return MY_STATES[k] || MY_STATES[k.replace(/^(wilayah persekutuan|federal territory of)\s+/, "")] || r;
  }
  return r;
}
function normCity(cc, s) {
  const c = cleanName(s);
  if (cc === "MY") return MY_CITY_FIX[c.toLowerCase()] || c;
  return c;
}

/* ───────────── address helpers ───────────── */
function v4ToInt(s) {
  return s.split(".").reduce((a, p) => a * 256 + Number(p), 0);
}
function v6ToBig(s) {
  let head = s;
  const m = /^(.*:)(\d+\.\d+\.\d+\.\d+)$/.exec(s);
  if (m) {
    const n = v4ToInt(m[2]);
    head = m[1] + [Math.floor(n / 65536).toString(16), (n % 65536).toString(16)].join(":");
  }
  const [a, b] = head.split("::");
  const left = a ? a.split(":") : [];
  const right = b !== undefined ? (b ? b.split(":") : []) : [];
  const fill = b !== undefined ? 8 - left.length - right.length : 0;
  const groups = [...left, ...Array(fill).fill("0"), ...right];
  let n = 0n;
  for (const g of groups) n = (n << 16n) | BigInt(parseInt(g || "0", 16));
  return n;
}

/** Splits one CSV line (RFC 4180: quoted fields may contain commas). */
function splitCsv(line) {
  const out = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; } else q = false;
      } else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

async function download(kind) {
  const now = new Date();
  for (let back = 0; back < 4; back++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - back, 1));
    const ym = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    const url = `https://download.db-ip.com/free/dbip-${kind}-lite-${ym}.csv.gz`;
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (geoip-build)" } });
    if (res.ok) {
      const tmp = path.join(os.tmpdir(), `dbip-${kind}-lite-${ym}.csv.gz`);
      console.log("Downloading", url, "...");
      await pipeline(Readable.fromWeb(res.body), createWriteStream(tmp));
      return { file: tmp, month: ym };
    }
  }
  throw new Error(`Could not download the DB-IP ${kind} file. Download dbip-${kind}-lite-YYYY-MM.csv.gz from https://db-ip.com/db/download/ip-to-${kind}-lite and pass its path to this script.`);
}
const monthOf = (f) => (/(\d{4}-\d{2})/.exec(path.basename(f)) || [])[1] || "unknown";

async function eachRow(file, fn) {
  const input = createReadStream(file);
  const src = file.endsWith(".gz") ? input.pipe(createGunzip()) : input;
  const rl = createInterface({ input: src, crlfDelay: Infinity });
  for await (const line of rl) if (line) fn(splitCsv(line));
}

/* ───────────── country-only files (small fallback) ───────────── */
async function buildCountry(file, month) {
  const v4 = [];
  const v6 = [];
  await eachRow(file, (f) => {
    const code = (f[2] || "ZZ").trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(code)) return;
    const kind = isIP(f[0]);
    if (kind === 4) v4.push([v4ToInt(f[0]), code]);
    else if (kind === 6) v6.push([v6ToBig(f[0]) >> 64n, code]);
  });
  v4.sort((x, y) => x[0] - y[0]);
  v6.sort((x, y) => (x[0] < y[0] ? -1 : x[0] > y[0] ? 1 : 0));
  const squash = (rows) => rows.filter((r, i) => !i || rows[i - 1][1] !== r[1]);
  const s4 = squash(v4);
  const s6 = squash(v6);
  function writeTable(name, magic, starts, bytesPer, put) {
    const head = Buffer.alloc(8);
    head.write(magic, 0, "ascii");
    head.writeUInt32LE(starts.length, 4);
    const sb = Buffer.alloc(starts.length * bytesPer);
    starts.forEach((s, i) => put(sb, s[0], i * bytesPer));
    const cb = Buffer.alloc(starts.length * 2);
    starts.forEach((s, i) => cb.write(s[1], i * 2, "ascii"));
    writeFileSync(path.join(OUT, name), Buffer.concat([head, sb, cb]));
  }
  writeTable("country-v4.bin", "GEO4", s4, 4, (b, v, o) => b.writeUInt32LE(v, o));
  writeTable("country-v6.bin", "GEO6", s6, 8, (b, v, o) => b.writeBigUInt64LE(v, o));
  console.log(`Country file: ${s4.length} IPv4 and ${s6.length} IPv6 ranges.`);
  return { month, v4Ranges: s4.length, v6Ranges: s6.length };
}

/* ───────────── city file ───────────── */
const varint = (arr, n) => {
  while (n >= 128) { arr.push((n % 128) | 128); n = Math.floor(n / 128); }
  arr.push(n);
};

async function buildCity(file, month) {
  const places = new Map(); // "CC|region|city" -> id
  const list = [];
  const idOf = (cc, region, city) => {
    const k = `${cc}|${region}|${city}`;
    let id = places.get(k);
    if (id === undefined) { id = list.length; places.set(k, id); list.push([cc, region, city]); }
    return id;
  };
  const v4 = [];
  const v6 = [];
  await eachRow(file, (f) => {
    const cc = (f[3] || "").trim().toUpperCase();
    // unknown space is kept as its own "ZZ" entry, so it is not swallowed by the neighbouring range
    const ok = /^[A-Z]{2}$/.test(cc) && cc !== "ZZ";
    const region = ok ? normRegion(cc, f[4]) : "";
    const city = ok && CITY_COUNTRIES.has(cc) ? normCity(cc, f[5]) : "";
    const id = idOf(ok ? cc : "ZZ", region, city);
    const kind = isIP(f[0]);
    if (kind === 4) v4.push([v4ToInt(f[0]), id]);
    else if (kind === 6) v6.push([Number(v6ToBig(f[0]) >> 80n), id]); // top 48 bits
  });
  v4.sort((x, y) => x[0] - y[0]);
  v6.sort((x, y) => x[0] - y[0]);
  const squash = (rows) => {
    const out = [];
    for (const r of rows) if (!out.length || out[out.length - 1][1] !== r[1]) out.push(r);
    return out;
  };
  const s4 = squash(v4);
  const s6 = squash(v6);
  // Only keep places that are still referenced; renumber them (biggest first so the common ones get small numbers).
  const use = new Map();
  for (const r of [...s4, ...s6]) use.set(r[1], (use.get(r[1]) || 0) + 1);
  const order = [...use.keys()].sort((a, b) => use.get(b) - use.get(a));
  const remap = new Map(order.map((old, i) => [old, i]));
  const table = order.map((old) => list[old]);
  const enc = (rows) => {
    const a = [];
    let prev = 0;
    for (const [s] of rows) { varint(a, s - prev); prev = s; }
    const b = [];
    for (const [, id] of rows) varint(b, remap.get(id));
    return [Buffer.from(a), Buffer.from(b)];
  };
  if (table.length > 65535) throw new Error("Too many distinct places for the compact format (" + table.length + ").");
  const [a4, b4] = enc(s4);
  const [a6, b6] = enc(s6);
  const json = Buffer.from(JSON.stringify(table), "utf8");
  const head = Buffer.alloc(32);
  head.write("GCT1", 0, "ascii");
  head.writeUInt32LE(json.length, 4);
  head.writeUInt32LE(s4.length, 8);
  head.writeUInt32LE(a4.length, 12);
  head.writeUInt32LE(b4.length, 16);
  head.writeUInt32LE(s6.length, 20);
  head.writeUInt32LE(a6.length, 24);
  head.writeUInt32LE(b6.length, 28);
  const raw = Buffer.concat([head, json, a4, b4, a6, b6]);
  const packed = brotliCompressSync(raw, { params: { [zc.BROTLI_PARAM_QUALITY]: 11, [zc.BROTLI_PARAM_LGWIN]: 24, [zc.BROTLI_PARAM_SIZE_HINT]: raw.length } });
  writeFileSync(path.join(OUT, "city.bin"), packed);
  console.log(`City file: ${table.length} places, ${s4.length} IPv4 + ${s6.length} IPv6 ranges, ${(raw.length / 1e6).toFixed(1)} MB raw -> ${(packed.length / 1e6).toFixed(1)} MB on disk.`);
  return { cityMonth: month, places: table.length, cityV4Ranges: s4.length, cityV6Ranges: s6.length, cityBytes: packed.length };
}

/* ───────────── main ───────────── */
const args = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
let meta = {};
try { meta = JSON.parse(readFileSync(path.join(OUT, "meta.json"), "utf8")); } catch { /* first run */ }
const flag = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] || "" : null; };
const bare = args.find((a) => !a.startsWith("--"));
let cityFile = flag("--city");
let countryFile = flag("--country") ?? (cityFile === null ? bare ?? null : null);
const auto = cityFile === null && countryFile === null;
let cityMonth;
let countryMonth;
if (auto) {
  const c = await download("city");
  cityFile = c.file; cityMonth = c.month;
  const k = await download("country");
  countryFile = k.file; countryMonth = k.month;
} else {
  if (cityFile) cityMonth = monthOf(cityFile);
  if (countryFile) countryMonth = monthOf(countryFile);
}
if (cityFile && !existsSync(cityFile)) throw new Error("File not found: " + cityFile);
if (countryFile && !existsSync(countryFile)) throw new Error("File not found: " + countryFile);
let next = { ...meta };
if (countryFile) next = { ...next, ...(await buildCountry(countryFile, countryMonth)), countryMonth };
if (cityFile) next = { ...next, ...(await buildCity(cityFile, cityMonth)) };
next.source = "DB-IP.com IP to City Lite + IP to Country Lite";
next.license = "CC BY 4.0 - attribution: IP Geolocation by DB-IP (https://db-ip.com)";
next.month = cityMonth || next.cityMonth || countryMonth || next.month;
next.builtAt = new Date().toISOString();
writeFileSync(path.join(OUT, "meta.json"), JSON.stringify(next, null, 2) + "\n");
console.log("Done. Restart the site (npm run dev / your host) to load the new data.");
