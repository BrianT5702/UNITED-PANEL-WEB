"use client";

import Link from "next/link";
import { useState } from "react";
import type { NavItem } from "@/lib/types";
import {
  CREATABLE_PAGE_GROUPS,
  adminEditHrefForPage,
  findPageForHref,
  pagesForLinkPickers,
  type PageGroup,
  type SitePage,
} from "@/lib/pages";
import { cloneNav } from "@/lib/nav";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { AdminGuide, AdminGuideButton } from "@/components/admin/AdminGuide";

function pageByPath(pages: SitePage[], href: string) {
  return findPageForHref(pages, href);
}

const CUSTOM_LINK = "__custom__";

export function NavEditor({
  initial,
  initialPages,
}: {
  initial: NavItem[];
  initialPages: SitePage[];
}) {
  const [items, setItems] = useState(() => cloneNav(initial));
  const [editablePages, setPages] = useState(initialPages);
  // Link pickers also offer pages with their own admin screen (e.g. Catalogues)
  const pages = pagesForLinkPickers(editablePages);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");
  const [dirty, setDirty] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newGroup, setNewGroup] = useState<Exclude<PageGroup, "Home">>("Other");
  const [guideOpen, setGuideOpen] = useState(false);

  function commit(next: NavItem[]) {
    setItems(next);
    setDirty(true);
    setMessage("");
  }

  function updateItem(index: number, patch: Partial<NavItem>) {
    const next = cloneNav(items);
    next[index] = { ...next[index], ...patch };
    if (patch.children === undefined && "children" in patch) {
      delete next[index].children;
    }
    commit(next);
  }

  function assignPage(index: number, path: string) {
    const page = pageByPath(pages, path);
    if (!page) return;
    updateItem(index, { label: page.label, href: page.path });
  }

  function assignChildPage(index: number, cIndex: number, path: string) {
    const page = pageByPath(pages, path);
    if (!page) return;
    const children = [...(items[index].children || [])];
    children[cIndex] = { label: page.label, href: page.path };
    updateItem(index, { children });
  }

  function moveItem(from: number, to: number) {
    if (to < 0 || to >= items.length) return;
    const next = cloneNav(items);
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    commit(next);
  }

  function addMainLink() {
    const first = pages[0];
    if (!first) return;
    commit([...items, { label: first.label, href: first.path }]);
  }

  function addSubLink(index: number) {
    const first = pages[0];
    if (!first) return;
    const children = [...(items[index].children || []), { label: first.label, href: first.path }];
    updateItem(index, { children });
  }

  async function save() {
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/admin/nav", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    setSaving(false);
    if (!res.ok) {
      setMessage("Could not save. Are you still logged in?");
      return;
    }
    const data = await res.json();
    if (Array.isArray(data.items)) setItems(cloneNav(data.items));
    setDirty(false);
    setMessage("Saved. Top bar updated on the live site.");
  }

  async function createPage() {
    setCreating(true);
    setMessage("");
    const res = await fetch("/api/admin/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: newTitle, group: newGroup }),
    });
    const data = await res.json().catch(() => ({}));
    setCreating(false);
    if (!res.ok) {
      setMessage(data.error || "Could not create page.");
      return;
    }
    if (Array.isArray(data.pages)) setPages(data.pages);
    const page = data.page as SitePage | undefined;
    if (page) {
      commit([...items, { label: page.label, href: page.path }]);
      setNewTitle("");
      setMessage(`Created “${page.label}”. It is added to the menu below — Save menu, then edit the page.`);
    }
  }

  return (
    <div className="ve-root ve-root-site">
      <div className="ve-edit-bar">
        <div className="ve-edit-bar-left">
          <span className="ve-edit-pill">Admin</span>
          <strong className="ve-edit-bar-title">Top navigation</strong>
          <Link className="ve-tool-btn ve-bar-link" href="/admin/edit">
            ← Back to site editor
          </Link>
          <Link className="ve-tool-btn ve-bar-link" href="/admin/catalogues">
            Catalogues
          </Link>
          <Link className="ve-tool-btn ve-bar-link is-dashboard" href="/admin/dashboard" title="See visitor statistics">
            Dashboard
          </Link>
        </div>
        <div className="ve-toolbar-actions">
          {message ? <span className="ve-msg">{message}</span> : null}
          {dirty ? <span className="ve-dirty">Unsaved</span> : null}
          <AdminGuideButton onClick={() => setGuideOpen(true)} />
          <button className="btn btn-primary ve-bar-btn" type="button" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save menu"}
          </button>
          <a className="btn btn-ghost ve-bar-btn" href="/" target="_blank" rel="noreferrer">
            View live
          </a>
          <LogoutButton className="ve-bar-btn" />
        </div>
      </div>

      <AdminGuide open={guideOpen} onClose={() => setGuideOpen(false)} />

      <main className="ve-nav-editor">
        <header className="ve-nav-intro">
          <h1>Edit top bar menu</h1>
          <p>
            Pick a page for each menu item — the link is filled in for you. Need a page that does not
            exist yet? Create an empty one below, then fill it in the page editor.
          </p>
        </header>

        <section className="ve-nav-create">
          <h2>Create a new empty page</h2>
          <p>Adds a blank page you can edit later. It is also added to the menu list below.</p>
          <div className="ve-nav-create-row">
            <label>
              Page title
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Careers"
              />
            </label>
            <label>
              Section
              <select
                value={newGroup}
                onChange={(e) => setNewGroup(e.target.value as Exclude<PageGroup, "Home">)}
              >
                {CREATABLE_PAGE_GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="btn btn-primary"
              disabled={creating || !newTitle.trim()}
              onClick={createPage}
            >
              {creating ? "Creating…" : "Create empty page"}
            </button>
          </div>
        </section>

        <div className="ve-nav-list">
          {items.map((item, index) => {
            const matched = pageByPath(pages, item.href);
            return (
              <article className="ve-nav-card" key={`${item.href}-${index}`}>
                <div className="ve-nav-card-head">
                  <span className="ve-nav-card-label">Main link {index + 1}</span>
                  <div className="ve-nav-card-actions">
                    <button type="button" className="ve-move" onClick={() => moveItem(index, index - 1)}>
                      ↑
                    </button>
                    <button type="button" className="ve-move" onClick={() => moveItem(index, index + 1)}>
                      ↓
                    </button>
                    <button
                      type="button"
                      className="ve-remove"
                      onClick={() => commit(items.filter((_, i) => i !== index))}
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="ve-nav-fields">
                  <label>
                    Page
                    <select
                      value={matched ? matched.path : item.href ? CUSTOM_LINK : ""}
                      onChange={(e) => {
                        if (e.target.value && e.target.value !== CUSTOM_LINK) assignPage(index, e.target.value);
                      }}
                    >
                      {!matched && !item.href ? <option value="">Choose a page…</option> : null}
                      {!matched && item.href ? (
                        <option value={CUSTOM_LINK}>Custom link: {item.href}</option>
                      ) : null}
                      {pages.map((p) => (
                        <option key={p.id} value={p.path}>
                          {p.group}: {p.label}
                          {p.custom ? " (new)" : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Menu label
                    <input
                      value={item.label}
                      onChange={(e) => updateItem(index, { label: e.target.value })}
                    />
                  </label>
                  <p className="ve-nav-path-hint">
                    Opens: <code>{item.href}</code>
                    {matched ? (
                      <>
                        {" · "}
                        <a href={adminEditHrefForPage(matched)}>
                          {matched.linkOnly ? "Manage page" : "Edit page"}
                        </a>
                      </>
                    ) : null}
                  </p>
                </div>

                <div className="ve-nav-subs">
                  <div className="ve-nav-subs-head">
                    <strong>Sub-links (dropdown)</strong>
                    <button type="button" className="ve-add-btn" onClick={() => addSubLink(index)}>
                      + Add sub-link
                    </button>
                  </div>
                  {(item.children || []).length === 0 ? (
                    <p className="ve-nav-empty">No dropdown — visitors only see this one top-bar link.</p>
                  ) : (
                    (item.children || []).map((child, cIndex) => {
                      const childPage = pageByPath(pages, child.href);
                      return (
                        <div className="ve-nav-sub-row" key={`${child.href}-${cIndex}`}>
                          <label>
                            Page
                            <select
                              value={childPage ? childPage.path : child.href ? CUSTOM_LINK : ""}
                              onChange={(e) => {
                                if (e.target.value && e.target.value !== CUSTOM_LINK)
                                  assignChildPage(index, cIndex, e.target.value);
                              }}
                            >
                              {!childPage && !child.href ? <option value="">Choose…</option> : null}
                              {!childPage && child.href ? (
                                <option value={CUSTOM_LINK}>Custom link: {child.href}</option>
                              ) : null}
                              {pages.map((p) => (
                                <option key={p.id} value={p.path}>
                                  {p.label}
                                  {p.custom ? " (new)" : ""}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label>
                            Menu label
                            <input
                              value={child.label}
                              aria-label="Sub-link label"
                              onChange={(e) => {
                                const children = [...(item.children || [])];
                                children[cIndex] = { ...child, label: e.target.value };
                                updateItem(index, { children });
                              }}
                            />
                          </label>
                          <p className="ve-nav-path-hint">
                            Opens: <code>{child.href}</code>
                          </p>
                          <button
                            type="button"
                            className="ve-remove"
                            onClick={() => {
                              const children = (item.children || []).filter((_, i) => i !== cIndex);
                              updateItem(index, { children: children.length ? children : undefined });
                            }}
                          >
                            ×
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </article>
            );
          })}
        </div>

        <button type="button" className="ve-add-btn ve-add-wide" onClick={addMainLink}>
          + Add main link to top bar
        </button>
      </main>
    </div>
  );
}
