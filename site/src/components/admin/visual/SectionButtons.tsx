"use client";

import { useState } from "react";
import type { HeroButton, HeroButtonAction } from "@/lib/page-document";
import {
  HERO_BUTTON_ACTION_LABELS,
  heroActionPlaceholder,
  heroButtonHref,
  newId,
  normalizeButtonAction,
} from "@/lib/page-document";
import type { SitePage } from "@/lib/pages";

function reorder<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length || from === to) return items;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/** Public / live render of section action buttons */
export function SectionButtonsView({
  buttons,
  className = "pb-section-actions",
}: {
  buttons: HeroButton[];
  className?: string;
}) {
  if (!buttons.length) return null;
  return (
    <div className={className}>
      {buttons.map((btn) => (
        <a
          key={btn.id}
          className={`btn ${btn.style === "ghost" ? "btn-ghost" : "btn-primary"}`}
          href={heroButtonHref(btn)}
        >
          {btn.label}
        </a>
      ))}
    </div>
  );
}

/** Compact, collapsible button editor for any section */
export function SectionButtonsEditor({
  buttons,
  onChange,
  dark,
  sectionTargets = [],
  sitePages = [],
}: {
  buttons: HeroButton[];
  onChange: (buttons: HeroButton[]) => void;
  dark?: boolean;
  sectionTargets?: { id: string; label: string }[];
  sitePages?: SitePage[];
}) {
  const [open, setOpen] = useState(buttons.length > 0);

  const patch = (index: number, next: Partial<HeroButton>) => {
    const list = [...buttons];
    list[index] = { ...list[index], ...next };
    onChange(list);
  };

  function addButton() {
    const firstPath =
      sitePages.find((p) => p.path === "/contact")?.path || sitePages[0]?.path || "/contact";
    onChange([
      ...buttons,
      {
        id: newId("btn"),
        label: "New button",
        href: firstPath,
        style: buttons.length === 0 ? "primary" : "ghost",
        action: "link",
      },
    ]);
    setOpen(true);
  }

  function setAction(index: number, action: HeroButtonAction) {
    const btn = buttons[index];
    if (action === "section") {
      const currentId = (btn.href || "").replace(/^#/, "");
      const stillValid = sectionTargets.some((t) => t.id === currentId);
      const nextId = stillValid ? currentId : sectionTargets[0]?.id || "";
      patch(index, { action, href: nextId ? `#${nextId}` : "#" });
      return;
    }
    const href = btn.href.startsWith("#")
      ? sitePages.find((p) => p.path === "/contact")?.path || sitePages[0]?.path || "/contact"
      : btn.href || "/contact";
    patch(index, { action, href });
  }

  return (
    <div className={`ve-btns${dark ? " is-dark" : ""}${open ? " is-open" : ""}`}>
      <div className="ve-btns-bar">
        <button type="button" className="ve-btns-toggle" onClick={() => setOpen((v) => !v)}>
          <span className="ve-btns-toggle-label">Buttons on this block</span>
          <span className="ve-btns-toggle-meta">
            {buttons.length === 0
              ? "None — click + Add"
              : `${buttons.length} button${buttons.length === 1 ? "" : "s"}`}
          </span>
          <span className="ve-btns-chevron" aria-hidden>
            {open ? "▾" : "▸"}
          </span>
        </button>
        <button type="button" className="ve-btns-add" onClick={addButton}>
          + Add
        </button>
      </div>

      {open ? (
        <div className="ve-btns-panel">
          {buttons.length === 0 ? (
            <p className="ve-btns-empty">No buttons yet. Click + Add to create one.</p>
          ) : (
            <ul className="ve-btns-list">
              {buttons.map((btn, index) => {
                const action = normalizeButtonAction(btn.action);
                const sectionId = (btn.href || "").replace(/^#/, "");
                const matchedPage = sitePages.find((p) => p.path === btn.href);
                return (
                  <li className="ve-btns-item" key={btn.id}>
                    <input
                      className="ve-btns-label"
                      value={btn.label}
                      aria-label="Button text"
                      placeholder="Button text"
                      onChange={(e) => patch(index, { label: e.target.value })}
                    />
                    <select
                      className="ve-btns-select"
                      value={btn.style || "primary"}
                      aria-label="Style"
                      onChange={(e) =>
                        patch(index, { style: e.target.value as "primary" | "ghost" })
                      }
                    >
                      <option value="primary">Filled</option>
                      <option value="ghost">Outline</option>
                    </select>
                    <select
                      className="ve-btns-select ve-btns-action"
                      value={action}
                      aria-label="Where it goes"
                      onChange={(e) => setAction(index, e.target.value as HeroButtonAction)}
                    >
                      {(Object.keys(HERO_BUTTON_ACTION_LABELS) as HeroButtonAction[]).map((key) => (
                        <option key={key} value={key}>
                          {HERO_BUTTON_ACTION_LABELS[key]}
                        </option>
                      ))}
                    </select>
                    {action === "section" ? (
                      <select
                        className="ve-btns-href"
                        value={sectionId}
                        aria-label="Section"
                        onChange={(e) =>
                          patch(index, { href: e.target.value ? `#${e.target.value}` : "#" })
                        }
                      >
                        {sectionTargets.length === 0 ? (
                          <option value="">No sections on this page</option>
                        ) : (
                          sectionTargets.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.label}
                            </option>
                          ))
                        )}
                      </select>
                    ) : sitePages.length > 0 ? (
                      <select
                        className="ve-btns-href"
                        value={matchedPage ? matchedPage.path : ""}
                        aria-label="Page"
                        onChange={(e) => {
                          if (e.target.value) patch(index, { href: e.target.value });
                        }}
                      >
                        {!matchedPage ? <option value="">Choose a page…</option> : null}
                        {sitePages.map((p) => (
                          <option key={p.id} value={p.path}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        className="ve-btns-href"
                        value={btn.href}
                        placeholder={heroActionPlaceholder("link")}
                        aria-label="Link"
                        onChange={(e) => patch(index, { href: e.target.value })}
                      />
                    )}
                    <div className="ve-btns-item-actions">
                      <button
                        type="button"
                        className="ve-btns-icon"
                        title="Move left"
                        onClick={() => onChange(reorder(buttons, index, index - 1))}
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        className="ve-btns-icon"
                        title="Move right"
                        onClick={() => onChange(reorder(buttons, index, index + 1))}
                      >
                        →
                      </button>
                      <button
                        type="button"
                        className="ve-btns-icon is-danger"
                        title="Remove"
                        onClick={() => onChange(buttons.filter((_, i) => i !== index))}
                      >
                        ×
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
