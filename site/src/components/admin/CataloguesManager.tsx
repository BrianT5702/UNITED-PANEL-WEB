"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { renderPdfFirstPageJpeg } from "@/lib/pdf-thumb-client";

type Item = {
  id: string;
  title: string;
  kind: "catalogue" | "brochure";
  description: string | null;
  fileUrl: string;
  fileName: string;
  mimeType: string;
  published: boolean;
  createdAt: string;
  permanentUrl?: string;
  permanentPath?: string;
  qrPreview?: string | null;
  /** First-page preview (PDFs) — null until generated */
  thumbUrl?: string | null;
  isPdf?: boolean;
};

const emptyForm = {
  title: "",
  kind: "catalogue" as "catalogue" | "brochure",
  description: "",
  published: true,
};

type Toast = { text: string; tone: "success" | "error" | "info" };

/** One preview job: try the server first, then render in this browser as a fallback */
type ThumbJob = { id: string; title: string; source: string | File; force?: boolean };

async function readError(res: Response): Promise<string> {
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  return data.error || `HTTP ${res.status}`;
}

function prettyLink(link: string) {
  return link.replace(/^https?:\/\//, "");
}

/** Accessible on/off switch (a button with role="switch") */
function VisibilitySwitch({
  checked,
  onChange,
  label,
  onText,
  offText,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  onText: string;
  offText: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`cat-switch${checked ? " is-on" : ""}`}
      disabled={disabled}
      onClick={() => onChange(!checked)}
    >
      <span className="cat-switch-track" aria-hidden>
        <span className="cat-switch-knob" />
      </span>
      <span className="cat-switch-text">
        <span className="cat-switch-label">{label}</span>
        <span className="cat-switch-state">{checked ? onText : offText}</span>
      </span>
    </button>
  );
}

export function CataloguesManager() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingFile, setPendingFile] = useState<{
    url: string;
    fileName: string;
    mimeType: string;
  } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({
    title: "",
    kind: "catalogue" as "catalogue" | "brochure",
    description: "",
    published: true,
  });
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  // Page-level "Show Catalogues page on website" (null while loading)
  const [pagePublic, setPagePublic] = useState<boolean | null>(null);
  const [pageSaving, setPageSaving] = useState(false);
  const [visibilityBusy, setVisibilityBusy] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const replaceTargetId = useRef<string | null>(null);
  // First-page previews: PDFs already tried this visit, plus queued jobs for
  // files just uploaded (rendered from the local file — no re-download needed)
  const thumbAttempted = useRef(new Set<string>());
  const thumbJobs = useRef<ThumbJob[]>([]);
  const [thumbBusyId, setThumbBusyId] = useState<string | null>(null);
  // Visible per-card problems ("Preview failed · Retry")
  const [thumbErrors, setThumbErrors] = useState<Record<string, string>>({});
  const [thumbTick, setThumbTick] = useState(0);
  const pendingFileRef = useRef<File | null>(null);

  const notify = useCallback((text: string, tone: Toast["tone"] = "success") => {
    setToast({ text, tone });
  }, []);

  // Auto-hide the toast (errors stay a little longer)
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), toast.tone === "error" ? 7000 : 4000);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!copiedId) return;
    const t = window.setTimeout(() => setCopiedId(null), 2000);
    return () => window.clearTimeout(t);
  }, [copiedId]);

  // After create / save: scroll the item into view and highlight it briefly
  useEffect(() => {
    if (!highlightId) return;
    const el = document.getElementById(`cat-item-${highlightId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    const t = window.setTimeout(() => setHighlightId(null), 2600);
    return () => window.clearTimeout(t);
  }, [highlightId, items]);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/catalogues");
    setLoading(false);
    if (!res.ok) {
      notify("Could not load catalogues. Are you still logged in?", "error");
      return;
    }
    const data = await res.json();
    setItems(Array.isArray(data.items) ? data.items : []);
  }, [notify]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/admin/catalogues/settings").catch(() => null);
      const data = res?.ok ? await res.json().catch(() => null) : null;
      setPagePublic(typeof data?.pagePublic === "boolean" ? data.pagePublic : true);
    })();
  }, []);

  async function togglePagePublic(next: boolean) {
    const prev = pagePublic;
    setPagePublic(next);
    setPageSaving(true);
    const res = await fetch("/api/admin/catalogues/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pagePublic: next }),
    }).catch(() => null);
    setPageSaving(false);
    if (!res?.ok) {
      setPagePublic(prev);
      notify(res ? await readError(res) : "Could not reach the server. Please try again.", "error");
      return;
    }
    notify(
      next
        ? "The Catalogues page is now on the website and in the menu."
        : "The Catalogues page is now hidden from visitors. QR codes still work.",
    );
  }

  // Per-item "Visible to public": update immediately, roll back if saving fails
  async function toggleItemVisible(item: Item, next: boolean) {
    setItems((list) => list.map((i) => (i.id === item.id ? { ...i, published: next } : i)));
    setVisibilityBusy((b) => ({ ...b, [item.id]: true }));
    const res = await fetch(`/api/admin/catalogues/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: next }),
    }).catch(() => null);
    setVisibilityBusy((b) => {
      const copy = { ...b };
      delete copy[item.id];
      return copy;
    });
    if (!res?.ok) {
      setItems((list) =>
        list.map((i) => (i.id === item.id ? { ...i, published: item.published } : i)),
      );
      const why = res ? await readError(res) : "Could not reach the server.";
      notify(`Could not change “${item.title}”: ${why}`, "error");
      return;
    }
    notify(
      next
        ? `“${item.title}” is now visible on the website.`
        : `“${item.title}” is now hidden from the public.`,
    );
  }

  function isPdfFile(file: File) {
    return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  }

  /** Queue a preview for a file the admin just uploaded (call after load()) */
  function queueThumbFromFile(id: string, title: string, file: File) {
    thumbAttempted.current.add(id);
    thumbJobs.current.push({ id, title, source: file });
    setThumbTick((t) => t + 1);
  }

  /** "Regenerate preview" / "Retry": re-render from the stored file */
  function regenerateThumb(item: Item) {
    thumbAttempted.current.add(item.id);
    thumbJobs.current = thumbJobs.current.filter((j) => j.id !== item.id);
    thumbJobs.current.push({ id: item.id, title: item.title, source: item.fileUrl, force: true });
    setThumbErrors((prev) => {
      const next = { ...prev };
      delete next[item.id];
      return next;
    });
    setThumbTick((t) => t + 1);
  }

  // Create missing first-page previews, one PDF at a time: queued jobs first
  // (new uploads, Regenerate), then any older PDF item that never had one.
  useEffect(() => {
    if (loading || thumbBusyId) return;
    let next = thumbJobs.current.shift();
    if (!next) {
      const missing = items.find(
        (i) => i.isPdf && !i.thumbUrl && !thumbAttempted.current.has(i.id),
      );
      if (!missing) return;
      thumbAttempted.current.add(missing.id);
      next = { id: missing.id, title: missing.title, source: missing.fileUrl };
    }
    const job = next;
    setThumbBusyId(job.id);
    void (async () => {
      let thumbUrl: string | null = null;
      let serverError = "";
      let browserError = "";
      // 1) Server render (pdf.js in Node) — the normal path
      try {
        const res = await fetch(
          `/api/admin/catalogues/${job.id}/thumb${job.force ? "?force=1" : ""}`,
          { method: "PUT" },
        );
        if (res.ok) {
          thumbUrl = ((await res.json()) as { thumbUrl?: string | null }).thumbUrl ?? null;
        } else {
          serverError = await readError(res);
        }
      } catch (err) {
        serverError = err instanceof Error ? err.message : String(err);
      }
      // 2) Fallback: render in this browser and upload the image
      if (!thumbUrl) {
        try {
          const source =
            typeof job.source === "string" ? job.source : await job.source.arrayBuffer();
          const blob = await renderPdfFirstPageJpeg(source, { width: 600, quality: 0.82 });
          const body = new FormData();
          body.append("file", blob, `${job.id}.jpg`);
          const res = await fetch(`/api/admin/catalogues/${job.id}/thumb`, {
            method: "POST",
            body,
          });
          if (res.ok) {
            thumbUrl = ((await res.json()) as { thumbUrl?: string | null }).thumbUrl ?? null;
          } else {
            browserError = await readError(res);
          }
        } catch (err) {
          browserError = err instanceof Error ? err.message : String(err);
        }
      }
      if (thumbUrl) {
        const url = thumbUrl;
        setItems((prev) => prev.map((i) => (i.id === job.id ? { ...i, thumbUrl: url } : i)));
        setThumbErrors((prev) => {
          if (!(job.id in prev)) return prev;
          const nextErrors = { ...prev };
          delete nextErrors[job.id];
          return nextErrors;
        });
      } else {
        const message = [
          serverError && `Server: ${serverError}`,
          browserError && `Browser: ${browserError}`,
        ]
          .filter(Boolean)
          .join(" · ");
        console.warn(`Could not create PDF preview for "${job.title}": ${message}`);
        setThumbErrors((prev) => ({ ...prev, [job.id]: message || "Unknown error" }));
      }
      setThumbBusyId(null);
    })();
  }, [items, loading, thumbBusyId, thumbTick]);

  async function uploadFile(file: File) {
    setUploading(true);
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/admin/catalogues/upload", { method: "POST", body });
    setUploading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      notify(data.error || "Upload failed.", "error");
      return null;
    }
    return (await res.json()) as { url: string; fileName: string; mimeType: string };
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const uploaded = await uploadFile(file);
    if (uploaded) {
      pendingFileRef.current = file;
      setPendingFile(uploaded);
      notify(`File ready: ${uploaded.fileName}`, "info");
    }
  }

  async function createItem() {
    if (!pendingFile) {
      notify("Choose a PDF (or image) to upload first.", "error");
      return;
    }
    if (!form.title.trim()) {
      notify("Please enter a title.", "error");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/catalogues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        kind: form.kind,
        description: form.description,
        published: form.published,
        fileUrl: pendingFile.url,
        fileName: pendingFile.fileName,
        mimeType: pendingFile.mimeType,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      notify(data.error || "Could not save.", "error");
      return;
    }
    const data = await res.json().catch(() => ({}));
    const newId: string | undefined = data?.item?.id;
    const title = form.title.trim();
    const localFile = pendingFileRef.current;
    pendingFileRef.current = null;
    setForm(emptyForm);
    setPendingFile(null);
    setEditingId(null);
    const makeThumb = Boolean(newId && localFile && isPdfFile(localFile));
    if (newId && makeThumb) thumbAttempted.current.add(newId); // render from the local file instead
    await load();
    if (newId && localFile && makeThumb) queueThumbFromFile(newId, title, localFile);
    if (newId) setHighlightId(newId);
    notify(`“${title}” added. Its QR code is ready to download.`);
  }

  function startEdit(item: Item) {
    setEditingId(item.id);
    setEditDraft({
      title: item.title,
      kind: item.kind,
      description: item.description || "",
      published: item.published,
    });
  }

  async function saveEdit(id: string) {
    if (!editDraft.title.trim()) {
      notify("Please enter a title.", "error");
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/admin/catalogues/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editDraft),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      notify(data.error || "Could not update.", "error");
      return;
    }
    setEditingId(null);
    await load();
    setHighlightId(id);
    notify("Changes saved.");
  }

  async function remove(id: string, title: string) {
    if (!window.confirm(`Delete “${title}”? Printed QR codes for this item will stop working.`)) {
      return;
    }
    const res = await fetch(`/api/admin/catalogues/${id}`, { method: "DELETE" });
    if (!res.ok) {
      notify("Could not delete.", "error");
      return;
    }
    if (editingId === id) setEditingId(null);
    notify(`“${title}” deleted.`);
    await load();
  }

  function downloadQr(item: Item) {
    window.open(`/api/admin/catalogues/${item.id}/qr`, "_blank");
  }

  async function copyLink(item: Item) {
    const url = item.permanentUrl || `${window.location.origin}/r/${item.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(item.id);
      notify("Link copied.", "info");
    } catch {
      notify(`Copy this link: ${url}`, "info");
    }
  }

  function startReplace(id: string) {
    replaceTargetId.current = id;
    replaceInputRef.current?.click();
  }

  async function onReplaceFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    const id = replaceTargetId.current;
    replaceTargetId.current = null;
    if (!file || !id) return;
    setUploading(true);
    const body = new FormData();
    body.append("file", file);
    const res = await fetch(`/api/admin/catalogues/${id}/file`, { method: "POST", body });
    setUploading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      notify(data.error || "Could not replace file.", "error");
      return;
    }
    // New file → fresh first-page preview, rendered from the file just picked
    const title = items.find((i) => i.id === id)?.title || "item";
    if (isPdfFile(file)) thumbAttempted.current.add(id);
    await load();
    if (isPdfFile(file)) queueThumbFromFile(id, title, file);
    setHighlightId(id);
    notify("File replaced. The same QR code and link still work.");
  }

  return (
    <div className="ve-root ve-root-site">
      <div className="ve-edit-bar">
        <div className="ve-edit-bar-left">
          <span className="ve-edit-pill">Admin</span>
          <strong className="ve-edit-bar-title">Catalogues &amp; brochures</strong>
          <Link className="ve-tool-btn ve-bar-link" href="/admin/edit">
            ← Back to site editor
          </Link>
          <a className="ve-tool-btn ve-bar-link" href="/catalogues" target="_blank" rel="noreferrer">
            View public page ↗
          </a>
        </div>
        <div className="ve-toolbar-actions">
          {uploading ? <span className="ve-msg">Uploading…</span> : null}
          <LogoutButton className="ve-bar-btn" />
        </div>
      </div>

      <main className="cat-admin">
        <header className="cat-admin-intro">
          <Link className="cat-admin-back" href="/admin/edit">
            ← Back to site editor
          </Link>
          <h1>Catalogues &amp; brochures</h1>
          <p>
            Upload a PDF catalogue or brochure. Each item gets a <strong>permanent QR code</strong>{" "}
            and short link (<code>/r/…</code>) that never changes — even if you replace the file
            later. Print the QR for showrooms, packaging, or ads; scanners open that document.
          </p>
        </header>

        <section
          className={`cat-admin-card cat-page-visibility${pagePublic === false ? " is-off" : ""}`}
          aria-label="Catalogues page visibility"
        >
          <VisibilitySwitch
            checked={pagePublic !== false}
            onChange={(next) => void togglePagePublic(next)}
            disabled={pagePublic === null || pageSaving}
            label="Show Catalogues page on website"
            onText="On: visitors can open the Catalogues page and see it in the menu"
            offText="Off: the Catalogues page and its menu item are hidden from visitors"
          />
          <p className="cat-page-visibility-help">
            Links and QR codes for single items (<code>/r/…</code>) keep working even when the page
            is off, so printed QR codes never break. To hide one item completely, switch off{" "}
            <strong>Visible to public</strong> on its card.
          </p>
        </section>

        <section className="cat-admin-card">
          <h2>Add new</h2>
          <div className="cat-admin-form">
            <label>
              Title
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. PIR Panel Catalogue 2026"
              />
            </label>
            <label>
              Type
              <select
                value={form.kind}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    kind: e.target.value === "brochure" ? "brochure" : "catalogue",
                  }))
                }
              >
                <option value="catalogue">Catalogue</option>
                <option value="brochure">Brochure</option>
              </select>
            </label>
            <label className="cat-admin-span">
              Short description (optional)
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Shown on the public catalogues page"
              />
            </label>
            <label className="cat-admin-check">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
              />
              Visible to public
            </label>
            <div className="cat-admin-upload-row">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf,image/*"
                hidden
                onChange={onPickFile}
              />
              <button
                type="button"
                className="btn btn-ghost"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? "Uploading…" : pendingFile ? "Change file" : "Choose PDF / image"}
              </button>
              {pendingFile ? (
                <span className="cat-admin-file-name">{pendingFile.fileName}</span>
              ) : (
                <span className="muted">Max 25MB · PDF preferred</span>
              )}
            </div>
            <div className="cat-admin-actions">
              <button
                type="button"
                className="btn btn-primary"
                disabled={uploading || saving}
                onClick={() => void createItem()}
              >
                {saving && !editingId ? "Saving…" : "Save & create QR"}
              </button>
            </div>
          </div>
        </section>

        <section className="cat-admin-card">
          <h2>
            Your items{" "}
            {!loading && items.length > 0 ? (
              <span className="cat-admin-count">{items.length}</span>
            ) : null}
          </h2>
          <input
            ref={replaceInputRef}
            type="file"
            accept=".pdf,application/pdf,image/*"
            hidden
            onChange={(e) => void onReplaceFile(e)}
          />
          {loading && items.length === 0 ? <p className="muted">Loading…</p> : null}
          {!loading && items.length === 0 ? (
            <p className="muted">No catalogues yet. Add one above.</p>
          ) : null}
          <ul className="cat-admin-list">
            {items.map((item) => {
              const link = item.permanentUrl || item.permanentPath || `/r/${item.id}`;
              const editing = editingId === item.id;
              const classes = [
                "cat-item",
                editing ? "is-editing" : "",
                highlightId === item.id ? "is-highlight" : "",
                !item.published ? "is-hidden" : "",
              ]
                .filter(Boolean)
                .join(" ");
              return (
                <li key={item.id} id={`cat-item-${item.id}`} className={classes}>
                  <div className="cat-item-body">
                    <a
                      className={`cat-item-thumb${thumbBusyId === item.id ? " is-busy" : ""}`}
                      href={item.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      title={
                        thumbBusyId === item.id ? "Creating preview…" : `Open ${item.fileName}`
                      }
                    >
                      {item.thumbUrl || item.mimeType.startsWith("image/") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.thumbUrl || item.fileUrl}
                          alt={`First page of ${item.title}`}
                          loading="lazy"
                        />
                      ) : (
                        <span className="cat-item-thumb-empty" aria-hidden>
                          {item.isPdf ? "PDF" : "FILE"}
                        </span>
                      )}
                    </a>

                    <div className="cat-item-info">
                      {editing ? (
                        <div className="cat-admin-edit">
                          <p className="cat-item-edit-title">Edit details</p>
                          <label>
                            Title
                            <input
                              value={editDraft.title}
                              onChange={(e) =>
                                setEditDraft((d) => ({ ...d, title: e.target.value }))
                              }
                            />
                          </label>
                          <label>
                            Type
                            <select
                              value={editDraft.kind}
                              onChange={(e) =>
                                setEditDraft((d) => ({
                                  ...d,
                                  kind: e.target.value === "brochure" ? "brochure" : "catalogue",
                                }))
                              }
                            >
                              <option value="catalogue">Catalogue</option>
                              <option value="brochure">Brochure</option>
                            </select>
                          </label>
                          <label>
                            Short description (optional)
                            <textarea
                              rows={2}
                              value={editDraft.description}
                              onChange={(e) =>
                                setEditDraft((d) => ({ ...d, description: e.target.value }))
                              }
                            />
                          </label>
                          <label className="cat-admin-check">
                            <input
                              type="checkbox"
                              checked={editDraft.published}
                              onChange={(e) =>
                                setEditDraft((d) => ({ ...d, published: e.target.checked }))
                              }
                            />
                            Visible to public
                          </label>
                          <div className="cat-item-edit-actions">
                            <button
                              type="button"
                              className="cat-btn cat-btn-primary"
                              disabled={saving}
                              onClick={() => void saveEdit(item.id)}
                            >
                              {saving ? "Saving…" : "Save changes"}
                            </button>
                            <button
                              type="button"
                              className="cat-btn cat-btn-subtle"
                              onClick={() => setEditingId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="cat-item-head">
                            <h3>{item.title}</h3>
                            <span className={`cat-badge cat-badge-${item.kind}`}>
                              {item.kind === "brochure" ? "Brochure" : "Catalogue"}
                            </span>
                            {!item.published ? (
                              <span className="cat-badge cat-badge-draft">Hidden</span>
                            ) : null}
                          </div>
                          {item.description ? (
                            <p className="cat-item-desc">{item.description}</p>
                          ) : null}
                          <div className="cat-item-link">
                            <span className="cat-item-link-label">Permanent link</span>
                            <a
                              className="cat-item-link-url"
                              href={link}
                              target="_blank"
                              rel="noreferrer"
                              title={link}
                            >
                              {prettyLink(link)}
                            </a>
                            <button
                              type="button"
                              className="cat-btn cat-btn-subtle cat-btn-sm"
                              onClick={() => void copyLink(item)}
                              aria-label={`Copy permanent link for ${item.title}`}
                            >
                              {copiedId === item.id ? "Copied!" : "Copy"}
                            </button>
                          </div>
                          <p className="cat-item-file">
                            <span className="cat-item-file-name" title={item.fileName}>
                              {item.fileName}
                            </span>
                            <span aria-hidden> · </span>
                            <span>
                              Added {new Date(item.createdAt).toLocaleDateString("en-MY")}
                            </span>
                          </p>
                          <div className="cat-item-visibility">
                            <VisibilitySwitch
                              checked={item.published}
                              onChange={(next) => void toggleItemVisible(item, next)}
                              disabled={Boolean(visibilityBusy[item.id])}
                              label="Visible to public"
                              onText="Visible on website"
                              offText="Hidden from public"
                            />
                          </div>
                          {thumbBusyId === item.id ? (
                            <p className="cat-item-thumb-status" role="status">
                              <span className="cat-item-thumb-spinner" aria-hidden />
                              Creating preview…
                            </p>
                          ) : thumbErrors[item.id] ? (
                            <p
                              className="cat-item-thumb-status is-error"
                              role="status"
                              title={thumbErrors[item.id]}
                            >
                              Preview failed ·{" "}
                              <button type="button" onClick={() => regenerateThumb(item)}>
                                Retry
                              </button>
                            </p>
                          ) : null}
                        </>
                      )}
                    </div>
                    {!editing ? (
                      <div className="cat-item-qr">
                        {item.qrPreview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.qrPreview}
                            alt={`QR code for ${item.title}`}
                            width={88}
                            height={88}
                          />
                        ) : (
                          <span className="cat-item-qr-empty" aria-hidden />
                        )}
                        <span className="cat-item-qr-caption">QR code</span>
                      </div>
                    ) : null}
                  </div>

                  {!editing ? (
                    <div className="cat-item-actions">
                      <div className="cat-item-actions-group">
                        <button
                          type="button"
                          className="cat-btn cat-btn-primary"
                          onClick={() => downloadQr(item)}
                        >
                          Download QR
                        </button>
                        <button
                          type="button"
                          className="cat-btn cat-btn-outline"
                          onClick={() => startEdit(item)}
                        >
                          Edit
                        </button>
                        <span className="cat-item-actions-sep" aria-hidden />
                        <a
                          className="cat-btn cat-btn-subtle"
                          href={item.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open file
                        </a>
                        <button
                          type="button"
                          className="cat-btn cat-btn-subtle"
                          disabled={uploading}
                          onClick={() => startReplace(item.id)}
                        >
                          Replace file
                        </button>
                        {item.isPdf ? (
                          <button
                            type="button"
                            className="cat-btn cat-btn-subtle"
                            disabled={thumbBusyId === item.id}
                            onClick={() => regenerateThumb(item)}
                            title="Create the first-page preview again"
                          >
                            Regenerate preview
                          </button>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        className="cat-btn cat-btn-danger"
                        onClick={() => void remove(item.id, item.title)}
                      >
                        Delete
                      </button>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      </main>

      <div
        className={`cat-toast${toast ? " is-visible" : ""}${toast ? ` cat-toast-${toast.tone}` : ""}`}
        role={toast?.tone === "error" ? "alert" : "status"}
        aria-live={toast?.tone === "error" ? "assertive" : "polite"}
      >
        {toast ? (
          <>
            <span className="cat-toast-icon" aria-hidden>
              {toast.tone === "error" ? "!" : toast.tone === "info" ? "i" : "✓"}
            </span>
            <span className="cat-toast-text">{toast.text}</span>
            <button
              type="button"
              className="cat-toast-close"
              onClick={() => setToast(null)}
              aria-label="Dismiss message"
            >
              ×
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
