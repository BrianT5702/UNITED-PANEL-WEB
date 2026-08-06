"use client";

import { useEffect, useRef, useState } from "react";
import type { PirContent } from "@/lib/pir";
import { LogoutButton } from "./LogoutButton";
import { AdminPageSwitcher } from "./AdminPageSwitcher";

function EText({
  value,
  onChange,
  className,
  as: Tag = "div",
  multiline,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  as?: "div" | "h1" | "h2" | "h3" | "p" | "span";
  multiline?: boolean;
}) {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || document.activeElement === el) return;
    if (el.textContent !== value) el.textContent = value;
  }, [value]);
  return (
    <Tag
      // @ts-expect-error polymorphic ref
      ref={ref}
      className={`ve-text ${className || ""}`}
      contentEditable
      suppressContentEditableWarning
      onBlur={(e) => onChange((e.currentTarget.textContent || "").trim())}
      title="Click to edit"
      style={multiline ? { whiteSpace: "pre-wrap" } : undefined}
    />
  );
}

function EImage({
  value,
  onChange,
  className,
  label = "Change photo",
}: {
  value: string;
  onChange: (url: string) => void;
  className?: string;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  async function onFile(file: File | null) {
    if (!file) return;
    setUploading(true);
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body });
    setUploading(false);
    if (!res.ok) {
      alert("Upload failed");
      return;
    }
    onChange((await res.json()).url);
  }
  return (
    <button type="button" className={`ve-image ${className || ""}`} onClick={() => inputRef.current?.click()}>
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" />
      ) : (
        <span>{uploading ? "Uploading…" : label}</span>
      )}
      <span className="ve-image-badge">{uploading ? "…" : "Change photo"}</span>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
    </button>
  );
}

export function VisualPirEditor({ initial }: { initial: PirContent }) {
  const [content, setContent] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [dirty, setDirty] = useState(false);

  function patch( partial: Partial<PirContent>) {
    setContent((prev) => ({ ...prev, ...partial }));
    setDirty(true);
    setMessage("");
  }

  async function saveAll() {
    setSaving(true);
    const res = await fetch("/api/admin/content/pir", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    setSaving(false);
    if (!res.ok) {
      setMessage("Could not save.");
      return;
    }
    setDirty(false);
    setMessage("Saved — PIR page updated.");
  }

  return (
    <div className="ve-root">
      <div className="ve-toolbar">
        <div>
          <strong>Visual editor — PIR</strong>
          <AdminPageSwitcher current="/admin/edit/pir" />
        </div>
        <div className="ve-toolbar-actions">
          {message ? <span className="ve-msg">{message}</span> : null}
          {dirty ? <span className="ve-dirty">Unsaved changes</span> : null}
          <button className="btn btn-primary" type="button" onClick={saveAll} disabled={saving}>
            {saving ? "Saving…" : "Save all"}
          </button>
          <a className="btn btn-ghost" href="/products/pir" target="_blank" rel="noreferrer">
            View live PIR
          </a>
          <LogoutButton />
        </div>
      </div>

      <main>
        <section className="hero hero-short ve-block">
          <div className="ve-section-label">Hero</div>
          <div className="hero-media">
            <EImage
              className="ve-hero-bg"
              value={content.heroImage}
              onChange={(heroImage) => patch({ heroImage })}
            />
            <div className="hero-veil" />
          </div>
          <div className="hero-content">
            <EText as="p" className="hero-brand" value={content.brand} onChange={(brand) => patch({ brand })} />
            <EText as="h1" value={content.headline} onChange={(headline) => patch({ headline })} />
            <EText as="p" className="hero-lead" value={content.lead} multiline onChange={(lead) => patch({ lead })} />
            <div className="hero-actions">
              <span className="btn btn-primary ve-cta">
                <EText as="span" value={content.primaryCta} onChange={(primaryCta) => patch({ primaryCta })} />
              </span>
              <span className="btn btn-ghost ve-cta">
                <EText as="span" value={content.secondaryCta} onChange={(secondaryCta) => patch({ secondaryCta })} />
              </span>
            </div>
          </div>
        </section>

        <section className="proof ve-block">
          <div className="ve-section-label">Proof points</div>
          {content.proof.map((item, index) => (
            <div className="proof-item ve-card" key={item.id}>
              <EText
                as="span"
                className="proof-index"
                value={item.index}
                onChange={(indexLabel) => {
                  const proof = [...content.proof];
                  proof[index] = { ...item, index: indexLabel };
                  patch({ proof });
                }}
              />
              <EText
                as="h2"
                value={item.title}
                onChange={(title) => {
                  const proof = [...content.proof];
                  proof[index] = { ...item, title };
                  patch({ proof });
                }}
              />
              <EText
                as="p"
                value={item.text}
                multiline
                onChange={(text) => {
                  const proof = [...content.proof];
                  proof[index] = { ...item, text };
                  patch({ proof });
                }}
              />
            </div>
          ))}
        </section>

        <section className="section ve-block" id="overview">
          <div className="ve-section-label">Overview</div>
          <div className="capability">
            <EImage
              className="capability-visual"
              value={content.overviewImage}
              onChange={(overviewImage) => patch({ overviewImage })}
            />
            <div>
              <EText
                as="p"
                className="eyebrow"
                value={content.overviewEyebrow}
                onChange={(overviewEyebrow) => patch({ overviewEyebrow })}
              />
              <EText
                as="h2"
                value={content.overviewTitle}
                onChange={(overviewTitle) => patch({ overviewTitle })}
              />
              <EText
                as="p"
                value={content.overviewBody1}
                multiline
                onChange={(overviewBody1) => patch({ overviewBody1 })}
              />
              <EText
                as="p"
                value={content.overviewBody2}
                multiline
                onChange={(overviewBody2) => patch({ overviewBody2 })}
              />
            </div>
          </div>
        </section>

        <section className="section section-compact ve-block">
          <div className="ve-section-label">Features</div>
          <div className="section-head">
            <EText
              as="p"
              className="eyebrow"
              value={content.featuresEyebrow}
              onChange={(featuresEyebrow) => patch({ featuresEyebrow })}
            />
            <EText
              as="h2"
              value={content.featuresTitle}
              onChange={(featuresTitle) => patch({ featuresTitle })}
            />
          </div>
          <ul className="pir-feature-list">
            {content.features.map((item, index) => (
              <li key={`${item}-${index}`}>
                <EText
                  as="span"
                  value={item}
                  onChange={(text) => {
                    const features = [...content.features];
                    features[index] = text;
                    patch({ features });
                  }}
                />
              </li>
            ))}
          </ul>
        </section>

        <section className="section section-compact ve-block">
          <div className="ve-section-label">Specifications</div>
          <div className="section-head">
            <EText
              as="p"
              className="eyebrow"
              value={content.specsEyebrow}
              onChange={(specsEyebrow) => patch({ specsEyebrow })}
            />
            <EText as="h2" value={content.specsTitle} onChange={(specsTitle) => patch({ specsTitle })} />
            <EText
              as="p"
              className="section-lead"
              value={content.specsLead}
              multiline
              onChange={(specsLead) => patch({ specsLead })}
            />
          </div>
          <div className="spec-table">
            {content.specs.map((row, index) => (
              <div className="spec-row" key={`${row.label}-${index}`}>
                <EText
                  as="span"
                  value={row.label}
                  onChange={(label) => {
                    const specs = [...content.specs];
                    specs[index] = { ...row, label };
                    patch({ specs });
                  }}
                />
                <EText
                  as="span"
                  value={row.value}
                  onChange={(value) => {
                    const specs = [...content.specs];
                    specs[index] = { ...row, value };
                    patch({ specs });
                  }}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="section section-compact ve-block">
          <div className="ve-section-label">Contact</div>
          <div className="contact-panel">
            <div>
              <EText
                as="p"
                className="eyebrow"
                value={content.contactEyebrow}
                onChange={(contactEyebrow) => patch({ contactEyebrow })}
              />
              <EText
                as="h2"
                value={content.contactTitle}
                onChange={(contactTitle) => patch({ contactTitle })}
              />
              <EText
                as="p"
                value={content.contactBody}
                multiline
                onChange={(contactBody) => patch({ contactBody })}
              />
              <ul className="contact-meta">
                <li>
                  <span>Email</span>
                  <EText as="span" value={content.email} onChange={(email) => patch({ email })} />
                </li>
                <li>
                  <span>Phone</span>
                  <EText as="span" value={content.phone} onChange={(phone) => patch({ phone })} />
                </li>
                <li>
                  <span>WhatsApp</span>
                  <EText as="span" value={content.whatsapp} onChange={(whatsapp) => patch({ whatsapp })} />
                </li>
              </ul>
            </div>
            <div className="ve-form-note">Visitor enquiry form stays on the live page.</div>
          </div>
        </section>
      </main>
    </div>
  );
}
