"use client";

import { useState } from "react";
import { countryFlag, fmtDuration, type CountryNode, type PlaceStat } from "@/lib/analytics-types";
import { Icon } from "./icons";
import { nf } from "./charts";

/**
 * Country > state > metro area / city, as an expandable tree. Each row shows visits, visitors and average visit time.
 * The state is the dependable level. Cities (and metro areas such as "Greater Johor Bahru") are approximate and sit
 * underneath. Visits from mobile carriers / VPNs count in the country total but get their own row, because their
 * state and city are unreliable. Rows with children are buttons (keyboard and screen-reader friendly).
 */
function Row({
  level,
  label,
  flag,
  icon,
  tag,
  title,
  stat,
  open,
  onToggle,
  expandable,
  muted,
}: {
  level: 0 | 1 | 2 | 3;
  label: string;
  flag?: string;
  icon?: "mobile" | "shield";
  tag?: string;
  title?: string;
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
        {icon ? <Icon name={icon} size={14} className="an2-loc-ic" /> : null}
        <span className={`an2-loc-label${muted ? " is-muted" : ""}`}>{label}</span>
        {tag ? <span className="an2-loc-tag">{tag}</span> : null}
      </span>
      <span className="an2-loc-num" data-h="Visits">{nf(stat.sessions)}</span>
      <span className="an2-loc-num" data-h="Visitors">{nf(stat.visitors)}</span>
      <span className="an2-loc-num" data-h="Avg. visit">{fmtDuration(stat.avgTimeSec)}</span>
      <span className="an2-loc-share" aria-hidden="true"><i style={{ width: `${Math.max(2, Math.min(100, stat.share))}%` }} /></span>
    </>
  );
  const cls = `an2-loc-row is-l${level}${muted ? " is-soft" : ""}`;
  return expandable ? (
    <button type="button" className={cls} onClick={onToggle} aria-expanded={!!open} title={title}>
      {body}
    </button>
  ) : (
    <div className={cls} title={title}>{body}</div>
  );
}

const NOT_KNOWN = new Set(["State not known", "City not known"]);

export function LocationTree({ rows }: { rows: CountryNode[] }) {
  const [openC, setOpenC] = useState<Record<string, boolean>>({});
  const [openR, setOpenR] = useState<Record<string, boolean>>({});
  const [openA, setOpenA] = useState<Record<string, boolean>>({});
  const regionHasKids = (r: CountryNode["regions"][number]) => r.areas.some((a) => !NOT_KNOWN.has(a.label));
  const countryHasKids = (c: CountryNode) => c.networks.length > 0 || c.regions.some((r) => !NOT_KNOWN.has(r.label) || regionHasKids(r));
  const all = rows.some(countryHasKids);
  const toggle = (set: typeof setOpenC, k: string) => set((o) => ({ ...o, [k]: !o[k] }));
  const setAll = (on: boolean) => {
    const c: Record<string, boolean> = {};
    const r: Record<string, boolean> = {};
    const a: Record<string, boolean> = {};
    if (on) {
      rows.forEach((x) => {
        c[x.code] = true;
        x.regions.forEach((y) => {
          r[`${x.code}|${y.label}`] = true;
          y.areas.forEach((z) => { if (z.cluster) a[`${x.code}|${y.label}|${z.label}`] = true; });
        });
        x.networks.forEach((n) => { r[`${x.code}|net|${n.kind}`] = true; });
      });
    }
    setOpenC(c);
    setOpenR(r);
    setOpenA(a);
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
        const isOpen = !!openC[cKey];
        return (
          <div key={cKey} className="an2-loc-group">
            <Row level={0} label={c.label} flag={countryFlag(c.code)} stat={c} expandable={countryHasKids(c)} open={isOpen} onToggle={() => toggle(setOpenC, cKey)} />
            {isOpen ? (
              <>
                {c.regions.map((r) => {
                  const rKey = `${cKey}|${r.label}`;
                  const kids = regionHasKids(r);
                  const rOpen = !!openR[rKey];
                  return (
                    <div key={rKey} className="an2-loc-sub">
                      <Row level={1} label={r.label} stat={r} expandable={kids} open={rOpen} onToggle={() => toggle(setOpenR, rKey)} muted={r.label === "State not known"} />
                      {rOpen
                        ? r.areas.map((a) => {
                            const aKey = `${rKey}|${a.label}`;
                            const aOpen = !!openA[aKey];
                            const names = a.cities.map((x) => `${x.label} (${x.sessions})`).join(", ");
                            return (
                              <div key={aKey}>
                                <Row
                                  level={2}
                                  label={a.label}
                                  tag={a.label === "City not known" ? undefined : a.cluster ? "area · approx." : "approx."}
                                  title={a.cluster ? `Includes: ${names}. Nearby towns are grouped because a network address cannot tell them apart.` : "City from the network location, approximate."}
                                  stat={a}
                                  expandable={a.cluster && a.cities.length > 0}
                                  open={aOpen}
                                  onToggle={() => toggle(setOpenA, aKey)}
                                  muted={a.label === "City not known"}
                                />
                                {a.cluster && aOpen ? a.cities.map((x) => <Row key={`${aKey}|${x.label}`} level={3} label={x.label} stat={x} expandable={false} />) : null}
                              </div>
                            );
                          })
                        : null}
                    </div>
                  );
                })}
                {c.networks.map((n) => {
                  const nKey = `${cKey}|net|${n.kind}`;
                  const nOpen = !!openR[nKey];
                  return (
                    <div key={nKey} className="an2-loc-sub is-net">
                      <Row
                        level={1}
                        label={n.label}
                        icon={n.kind === "mobile" ? "mobile" : "shield"}
                        title={n.kind === "mobile" ? "Counted in the country total only. On mobile data the location is usually the carrier's network hub, not the visitor." : "Counted in the country total only. VPNs and data centres show where the server is, not the visitor."}
                        stat={n}
                        expandable={n.carriers.length > 0}
                        open={nOpen}
                        onToggle={() => toggle(setOpenR, nKey)}
                        muted
                      />
                      {nOpen ? n.carriers.map((x) => <Row key={`${nKey}|${x.label}`} level={2} label={x.label} stat={x} expandable={false} />) : null}
                    </div>
                  );
                })}
              </>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
