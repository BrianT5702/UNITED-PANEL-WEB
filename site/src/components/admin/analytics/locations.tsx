"use client";

import { useState } from "react";
import { countryFlag, fmtDuration, type CountryNode, type PlaceStat } from "@/lib/analytics-types";
import { Icon } from "./icons";
import { nf } from "./charts";

/**
 * Country > state/region > city, as an expandable tree. Each row shows visits, visitors and average visit time.
 * Rows with children are buttons (keyboard and screen-reader friendly); rows without children are plain.
 */
function Row({
  level,
  label,
  flag,
  stat,
  open,
  onToggle,
  expandable,
  muted,
}: {
  level: 0 | 1 | 2;
  label: string;
  flag?: string;
  stat: PlaceStat;
  open?: boolean;
  onToggle?: () => void;
  expandable: boolean;
  muted?: boolean;
}) {
  const body = (
    <>
      <span className="an2-loc-name">
        {expandable ? <Icon name="chevronDown" size={14} className={`an2-loc-chev${open ? " is-open" : ""}`} /> : <span className="an2-loc-chev-gap" aria-hidden="true" />}
        {flag ? <span className="an2-flag" aria-hidden="true">{flag}</span> : null}
        <span className={`an2-loc-label${muted ? " is-muted" : ""}`}>{label}</span>
      </span>
      <span className="an2-loc-num" data-h="Visits">{nf(stat.sessions)}</span>
      <span className="an2-loc-num" data-h="Visitors">{nf(stat.visitors)}</span>
      <span className="an2-loc-num" data-h="Avg. visit">{fmtDuration(stat.avgTimeSec)}</span>
      <span className="an2-loc-share" aria-hidden="true"><i style={{ width: `${Math.max(2, Math.min(100, stat.share))}%` }} /></span>
    </>
  );
  const cls = `an2-loc-row is-l${level}`;
  return expandable ? (
    <button type="button" className={cls} onClick={onToggle} aria-expanded={!!open}>
      {body}
    </button>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export function LocationTree({ rows }: { rows: CountryNode[] }) {
  const [openC, setOpenC] = useState<Record<string, boolean>>({});
  const [openR, setOpenR] = useState<Record<string, boolean>>({});
  const all = rows.some((c) => c.regions.some((r) => r.label !== "State not known" || r.cities.some((x) => x.label !== "City not known")));
  const toggleC = (k: string) => setOpenC((o) => ({ ...o, [k]: !o[k] }));
  const toggleR = (k: string) => setOpenR((o) => ({ ...o, [k]: !o[k] }));
  const setAll = (on: boolean) => {
    const c: Record<string, boolean> = {};
    const r: Record<string, boolean> = {};
    if (on) rows.forEach((x) => { c[x.code] = true; x.regions.forEach((y) => { r[`${x.code}|${y.label}`] = true; }); });
    setOpenC(c);
    setOpenR(r);
  };
  return (
    <div className="an2-loc" role="tree" aria-label="Visits by country, state and city">
      <div className="an2-loc-head">
        <span>Place</span>
        <span>Visits</span>
        <span>Visitors</span>
        <span>Avg. visit</span>
        <span aria-hidden="true" />
      </div>
      {all ? (
        <div className="an2-loc-tools">
          <button type="button" className="an2-link" onClick={() => setAll(true)}>Expand all</button>
          <button type="button" className="an2-link" onClick={() => setAll(false)}>Collapse all</button>
        </div>
      ) : null}
      {rows.map((c) => {
        const cKey = c.code;
        const hasKids = c.regions.some((r) => r.label !== "State not known" || r.cities.some((x) => x.label !== "City not known"));
        const isOpen = !!openC[cKey];
        return (
          <div key={cKey} className="an2-loc-group">
            <Row level={0} label={c.label} flag={countryFlag(c.code)} stat={c} expandable={hasKids} open={isOpen} onToggle={() => toggleC(cKey)} />
            {isOpen
              ? c.regions.map((r) => {
                  const rKey = `${cKey}|${r.label}`;
                  const kids = r.cities.some((x) => x.label !== "City not known");
                  const rOpen = !!openR[rKey];
                  return (
                    <div key={rKey} className="an2-loc-sub">
                      <Row level={1} label={r.label} stat={r} expandable={kids} open={rOpen} onToggle={() => toggleR(rKey)} muted={r.label === "State not known"} />
                      {rOpen ? r.cities.map((x) => <Row key={`${rKey}|${x.label}`} level={2} label={x.label} stat={x} expandable={false} muted={x.label === "City not known"} />) : null}
                    </div>
                  );
                })
              : null}
          </div>
        );
      })}
    </div>
  );
}
