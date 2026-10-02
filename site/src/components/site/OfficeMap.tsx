"use client";

import { useEffect, useState } from "react";
import { officeMapEmbedUrl, officeMapOpenUrl } from "@/lib/page-document";

export type OfficeMapPin = { id: string; label: string; query: string };

/** Google Map (no API key) with one tab per office. Same component on the live site and in the editor. */
export function OfficeMap({ title, pins }: { title?: string; pins: OfficeMapPin[] }) {
  const usable = pins.filter((p) => p.query.trim());
  const [activeId, setActiveId] = useState(usable[0]?.id ?? "");
  const active = usable.find((p) => p.id === activeId) ?? usable[0];
  const query = active?.query.trim() ?? "";

  // Switching office loads at once; editing the place text waits until typing pauses
  const [shown, setShown] = useState({ id: active?.id ?? "", q: query });
  const activeKey = active?.id ?? "";
  useEffect(() => {
    if (shown.id === activeKey && shown.q === query) return;
    const t = setTimeout(() => setShown({ id: activeKey, q: query }), shown.id === activeKey ? 600 : 0);
    return () => clearTimeout(t);
  }, [activeKey, query, shown]);
  const shownQuery = shown.id === activeKey ? shown.q : query;

  if (!active) return null;

  return (
    <div className="office-map">
      <div className="office-map-bar">
        {title ? <h3 className="office-map-title">{title}</h3> : null}
        {usable.length > 1 ? (
          <div className="office-map-tabs" role="tablist" aria-label="Choose an office on the map">
            {usable.map((p) => (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={p.id === active.id}
                className={`office-map-tab${p.id === active.id ? " is-active" : ""}`}
                onClick={() => setActiveId(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>
        ) : null}
        <a className="office-map-open" href={officeMapOpenUrl(query)} target="_blank" rel="noreferrer">
          Open in Google Maps ↗
        </a>
      </div>
      <div className="office-map-frame">
        <iframe
          key={`${activeKey}:${shownQuery}`}
          title={`Map: ${active.label}`}
          src={officeMapEmbedUrl(shownQuery || query)}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
    </div>
  );
}
