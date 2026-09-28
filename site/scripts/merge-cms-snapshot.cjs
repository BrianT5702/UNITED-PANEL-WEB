#!/usr/bin/env node
"use strict";

/**
 * Three-way merge for content/cms-snapshot.json.
 *
 *   base     = snapshot last committed on the server (before this pull)
 *   live     = what editors saved on the server (database export)
 *   incoming = snapshot just pulled from GitHub
 *
 * A section editors changed on the server is kept.
 * A section that changed only in git is updated.
 * If both sides changed the same section, the server edit wins.
 */

const fs = require("fs");

function usage() {
  console.error(
    "Usage: node scripts/merge-cms-snapshot.cjs --base <file> --live <file> --incoming <file> --out <file>",
  );
}

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const value = argv[i + 1];
    if (!value || value.startsWith("--")) {
      console.error(`Missing value for --${key}`);
      usage();
      process.exit(1);
    }
    out[key] = value;
    i += 1;
  }
  return out;
}

function loadSnapshot(filePath) {
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    throw new Error(`Could not read CMS snapshot ${filePath}: ${err.message}`);
  }
  if (!parsed || !Array.isArray(parsed.sections)) {
    throw new Error(`${filePath} is not a CMS snapshot (missing sections array)`);
  }
  return parsed;
}

function sectionId(section) {
  return `${section.page}\0${section.key}`;
}

function sectionLabel(id) {
  return id.replace("\0", "/");
}

/** Stable JSON so key order does not look like a content change. */
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function sameData(a, b) {
  if (!a || !b) return false;
  return canonical(a.data) === canonical(b.data);
}

function indexSections(snapshot) {
  const map = new Map();
  for (const section of snapshot.sections) {
    if (!section || typeof section.page !== "string" || typeof section.key !== "string") continue;
    if (!section.page || !section.key || section.page === "__cms_sync") continue;
    map.set(sectionId(section), section);
  }
  return map;
}

function mergeSnapshots(baseSnap, liveSnap, incomingSnap) {
  const base = indexSections(baseSnap);
  const live = indexSections(liveSnap);
  const incoming = indexSections(incomingSnap);
  const ids = [...new Set([...base.keys(), ...live.keys(), ...incoming.keys()])].sort();

  const sections = [];
  const stats = {
    keptLive: 0,
    tookGit: 0,
    conflicts: 0,
    addedGit: 0,
    addedLive: 0,
    dropped: 0,
  };

  for (const id of ids) {
    const b = base.get(id);
    const l = live.get(id);
    const i = incoming.get(id);
    const label = sectionLabel(id);

    if (l && i) {
      if (sameData(l, i)) {
        sections.push(l);
        continue;
      }
      if (b && sameData(l, b)) {
        sections.push(i);
        stats.tookGit += 1;
        console.log(`CMS merge: applied git update for ${label}`);
        continue;
      }
      if (b && sameData(i, b)) {
        sections.push(l);
        stats.keptLive += 1;
        console.log(`CMS merge: kept live edit for ${label}`);
        continue;
      }
      sections.push(l);
      stats.conflicts += 1;
      console.log(`CMS merge: both sides changed ${label}; kept the live edit`);
      continue;
    }

    if (l && !i) {
      if (!b) {
        sections.push(l);
        stats.addedLive += 1;
        console.log(`CMS merge: kept server-only section ${label}`);
        continue;
      }
      if (sameData(l, b)) {
        stats.dropped += 1;
        console.log(`CMS merge: removed ${label} (deleted in git, unchanged on the server)`);
        continue;
      }
      sections.push(l);
      stats.conflicts += 1;
      console.log(`CMS merge: git deleted ${label}, but the server edited it; kept the live edit`);
      continue;
    }

    if (i && !l) {
      if (!b) {
        sections.push(i);
        stats.addedGit += 1;
        console.log(`CMS merge: added git section ${label}`);
        continue;
      }
      if (sameData(i, b)) {
        stats.dropped += 1;
        console.log(`CMS merge: removed ${label} (deleted on the server, unchanged in git)`);
        continue;
      }
      stats.dropped += 1;
      stats.conflicts += 1;
      console.log(`CMS merge: server deleted ${label}, which also changed in git; kept the deletion`);
    }
  }

  sections.sort((a, b) => a.page.localeCompare(b.page) || a.key.localeCompare(b.key));

  return {
    snapshot: {
      version: incomingSnap.version || liveSnap.version || baseSnap.version || 1,
      exportedAt: new Date().toISOString(),
      sections,
    },
    stats,
  };
}

function main() {
  const args = parseArgs(process.argv);
  if (!args.base || !args.live || !args.incoming || !args.out) {
    usage();
    process.exit(1);
  }

  const { snapshot, stats } = mergeSnapshots(
    loadSnapshot(args.base),
    loadSnapshot(args.live),
    loadSnapshot(args.incoming),
  );
  fs.writeFileSync(args.out, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(
    `CMS merge: ${snapshot.sections.length} sections — ` +
      `${stats.keptLive} live edit(s) kept, ${stats.tookGit} git update(s) applied, ` +
      `${stats.addedLive} server-only, ${stats.addedGit} git-only, ` +
      `${stats.dropped} removed, ${stats.conflicts} conflict(s) kept the server side.`,
  );
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error(err.message || err);
    process.exit(1);
  }
}

module.exports = { mergeSnapshots, canonical };
