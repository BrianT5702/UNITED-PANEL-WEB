"use client";

import { useEffect, useRef, useState } from "react";
import type { HomeContent, OfferItem, ProductItem, ProofItem, CertificateItem } from "@/lib/types";
import { LogoutButton } from "./LogoutButton";
import { AdminPageSwitcher } from "./AdminPageSwitcher";

function newId() {
  return `id_${Math.random().toString(36).slice(2, 10)}`;
}

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
  as?: "div" | "h1" | "h2" | "h3" | "p" | "span" | "strong";
  multiline?: boolean;
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (document.activeElement === el) return;
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
      title="Click to edit text"
      style={multiline ? { whiteSpace: "pre-wrap" } : undefined}
    />
  );
}

function EImage({
  value,
  onChange,
  className,
  label = "Click to add / change photo",
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
      alert("Upload failed. Try a JPG or PNG under 8MB.");
      return;
    }
    const data = await res.json();
    onChange(data.url);
  }

  return (
    <button type="button" className={`ve-image ${className || ""}`} onClick={() => inputRef.current?.click()}>
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" />
      ) : (
        <span>{uploading ? "Uploading…" : label}</span>
      )}
      <span className="ve-image-badge">{uploading ? "Uploading…" : "Change photo"}</span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="ve-section-label">{children}</div>;
}

export function VisualHomeEditor({ initial }: { initial: HomeContent }) {
  const [content, setContent] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [dirty, setDirty] = useState(false);
  const [drag, setDrag] = useState<{ key: "products" | "parts" | "services" | "proof" | "certificates"; from: number } | null>(null);

  function update<K extends keyof HomeContent>(key: K, value: HomeContent[K]) {
    setContent((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
    setMessage("");
  }

  function reorderList<T>(items: T[], from: number, to: number) {
    if (to < 0 || to >= items.length || from === to) return items;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    return next;
  }

  async function saveAll() {
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/admin/content/all", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    setSaving(false);
    if (!res.ok) {
      setMessage("Could not save. Are you still logged in?");
      return;
    }
    setDirty(false);
    setMessage("Saved — homepage updated.");
  }

  const { hero, proof, products, parts, services, capability, certificates, contact, footer, settings } =
    content;

  return (
    <div className="ve-root">
      <div className="ve-toolbar">
        <div>
          <strong>Visual editor — Homepage</strong>
          <AdminPageSwitcher current="/admin/edit" />
          <span>Click text/photos to edit. Drag ⠿ on a card to reorder, or use ← →. Then Save all.</span>
        </div>
        <div className="ve-toolbar-actions">
          {message ? <span className="ve-msg">{message}</span> : null}
          {dirty ? <span className="ve-dirty">Unsaved changes</span> : null}
          <button className="btn btn-primary" type="button" onClick={saveAll} disabled={saving}>
            {saving ? "Saving…" : "Save all"}
          </button>
          <a className="btn btn-ghost" href="/" target="_blank" rel="noreferrer">
            View live site
          </a>
          <a className="btn btn-ghost" href="/admin/advanced">
            Advanced forms
          </a>
          <LogoutButton />
        </div>
      </div>

      <header className="site-header is-scrolled ve-header">
        <div className="brand ve-logo-wrap">
          <EImage
            className="ve-logo"
            value={settings.logoUrl}
            onChange={(logoUrl) => update("settings", { ...settings, logoUrl })}
            label="Logo"
          />
        </div>
        <nav className="nav" aria-label="Preview nav">
          {content.nav.items.map((item, index) => (
            <span key={`${item.label}-${index}`} className="ve-nav-item">
              <EText
                as="span"
                value={item.label}
                onChange={(label) => {
                  const items = [...content.nav.items];
                  items[index] = { ...item, label };
                  update("nav", { items });
                }}
              />
              <button
                type="button"
                className="ve-mini-btn"
                onClick={() =>
                  update("nav", { items: content.nav.items.filter((_, i) => i !== index) })
                }
              >
                ×
              </button>
            </span>
          ))}
          <button
            type="button"
            className="ve-add-btn"
            onClick={() =>
              update("nav", {
                items: [...content.nav.items, { label: "New link", href: "/#" }],
              })
            }
          >
            + Nav link
          </button>
        </nav>
      </header>

      <main>
        <section className="hero hero-short ve-block">
          <SectionLabel>Hero — click text or background photo</SectionLabel>
          <div className="hero-media" aria-hidden="true">
            <EImage
              className="ve-hero-bg"
              value={hero.backgroundImage}
              onChange={(backgroundImage) => update("hero", { ...hero, backgroundImage })}
              label="Hero background photo"
            />
            <div className="hero-veil" />
          </div>
          <div className="hero-content">
            <EText
              as="p"
              className="hero-brand"
              value={hero.brand}
              onChange={(brand) => update("hero", { ...hero, brand })}
            />
            <EText
              as="h1"
              value={hero.headline}
              onChange={(headline) => update("hero", { ...hero, headline })}
            />
            <EText
              as="p"
              className="hero-lead"
              value={hero.lead}
              multiline
              onChange={(lead) => update("hero", { ...hero, lead })}
            />
            <div className="hero-actions">
              <span className="btn btn-primary ve-cta">
                <EText
                  as="span"
                  value={hero.primaryCtaLabel}
                  onChange={(primaryCtaLabel) => update("hero", { ...hero, primaryCtaLabel })}
                />
              </span>
              <span className="btn btn-ghost ve-cta">
                <EText
                  as="span"
                  value={hero.secondaryCtaLabel}
                  onChange={(secondaryCtaLabel) => update("hero", { ...hero, secondaryCtaLabel })}
                />
              </span>
            </div>
          </div>
        </section>

        <nav className="jump-bar">
          <a href="#products">Panels</a>
          <a href="#parts">Parts</a>
          <a href="#services">Services</a>
          <a href="#contact">Contact</a>
        </nav>

        <section className="proof ve-block">
          <SectionLabel>Proof points</SectionLabel>
          {proof.items.map((item, index) => (
            <div className="proof-item ve-card" key={item.id}>
              <button
                type="button"
                className="ve-remove"
                onClick={() =>
                  update("proof", { items: proof.items.filter((_, i) => i !== index) })
                }
              >
                Remove
              </button>
              <EText
                as="span"
                className="proof-index"
                value={item.index}
                onChange={(indexLabel) => {
                  const items = [...proof.items];
                  items[index] = { ...item, index: indexLabel };
                  update("proof", { items });
                }}
              />
              <EText
                as="h2"
                value={item.title}
                onChange={(title) => {
                  const items = [...proof.items];
                  items[index] = { ...item, title };
                  update("proof", { items });
                }}
              />
              <EText
                as="p"
                value={item.text}
                multiline
                onChange={(text) => {
                  const items = [...proof.items];
                  items[index] = { ...item, text };
                  update("proof", { items });
                }}
              />
            </div>
          ))}
          <button
            type="button"
            className="ve-add-btn ve-add-wide"
            onClick={() =>
              update("proof", {
                items: [
                  ...proof.items,
                  {
                    id: newId(),
                    index: String(proof.items.length + 1).padStart(2, "0"),
                    title: "New highlight",
                    text: "Describe this point.",
                  } satisfies ProofItem,
                ],
              })
            }
          >
            + Add proof point
          </button>
        </section>

        {(
          [
            ["products", products, false],
            ["parts", parts, true],
            ["services", services, true],
          ] as const
        ).map(([key, section, compact]) => (
          <section
            className={`section${compact ? " section-compact" : ""} ve-block`}
            id={key}
            key={key}
          >
            <SectionLabel>
              {key === "products" ? "Panels" : key === "parts" ? "Refrigeration parts" : "Services"}
            </SectionLabel>
            <div className="section-head">
              <EText
                as="p"
                className="eyebrow"
                value={section.eyebrow}
                onChange={(eyebrow) => update(key, { ...section, eyebrow })}
              />
              <EText
                as="h2"
                value={section.title}
                onChange={(title) => update(key, { ...section, title })}
              />
              <EText
                as="p"
                className="section-lead"
                value={section.lead}
                multiline
                onChange={(lead) => update(key, { ...section, lead })}
              />
            </div>
            <div className={compact ? "offer-grid" : "product-grid"}>
              {section.items.map((item, index) => (
                <div
                  className={`${compact ? "offer-card" : "product-card"} ve-card${drag?.key === key && drag.from === index ? " ve-dragging" : ""}`}
                  key={item.id}
                  onDragOver={(e) => {
                    if (drag?.key !== key) return;
                    e.preventDefault();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (drag?.key !== key) return;
                    update(key, {
                      ...section,
                      items: reorderList(section.items, drag.from, index),
                    });
                    setDrag(null);
                  }}
                >
                  <div className="ve-card-actions">
                    <button
                      type="button"
                      className="ve-drag"
                      draggable
                      title="Drag to reorder"
                      onDragStart={(e) => {
                        setDrag({ key, from: index });
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", String(index));
                      }}
                      onDragEnd={() => setDrag(null)}
                    >
                      ⠿ Drag
                    </button>
                    <button
                      type="button"
                      className="ve-move"
                      title="Move left"
                      onClick={() =>
                        update(key, {
                          ...section,
                          items: reorderList(section.items, index, index - 1),
                        })
                      }
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      className="ve-move"
                      title="Move right"
                      onClick={() =>
                        update(key, {
                          ...section,
                          items: reorderList(section.items, index, index + 1),
                        })
                      }
                    >
                      →
                    </button>
                    <button
                      type="button"
                      className="ve-remove"
                      onClick={() =>
                        update(key, {
                          ...section,
                          items: section.items.filter((_, i) => i !== index),
                        })
                      }
                    >
                      Remove
                    </button>
                  </div>
                  <EImage
                    className={compact ? "offer-card-image" : "product-card-image"}
                    value={item.image}
                    onChange={(image) => {
                      const items = [...section.items];
                      items[index] = { ...item, image };
                      update(key, { ...section, items });
                    }}
                  />
                  <div className={compact ? "offer-card-body" : "product-card-body"}>
                    <EText
                      as="h3"
                      value={item.title}
                      onChange={(title) => {
                        const items = [...section.items];
                        items[index] = { ...item, title };
                        update(key, { ...section, items });
                      }}
                    />
                    <EText
                      as="p"
                      value={item.text}
                      multiline
                      onChange={(text) => {
                        const items = [...section.items];
                        items[index] = { ...item, text };
                        update(key, { ...section, items });
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="ve-add-btn ve-add-wide"
              onClick={() => {
                const blank: ProductItem | OfferItem = {
                  id: newId(),
                  title: "New item",
                  text: "Short description.",
                  image: "",
                  href: "#",
                };
                update(key, { ...section, items: [...section.items, blank] });
              }}
            >
              + Add card
            </button>
          </section>
        ))}

        <section className="section section-compact ve-block" id="capability">
          <SectionLabel>Capability</SectionLabel>
          <div className="capability capability-compact">
            <EImage
              className="capability-visual"
              value={capability.image}
              onChange={(image) => update("capability", { ...capability, image })}
              label="Capability photo"
            />
            <div>
              <EText
                as="p"
                className="eyebrow"
                value={capability.eyebrow}
                onChange={(eyebrow) => update("capability", { ...capability, eyebrow })}
              />
              <EText
                as="h2"
                value={capability.title}
                onChange={(title) => update("capability", { ...capability, title })}
              />
              <EText
                as="p"
                value={capability.body}
                multiline
                onChange={(body) => update("capability", { ...capability, body })}
              />
              <ul className="capability-list">
                {capability.points.map((point, index) => (
                  <li key={`${point}-${index}`} className="ve-card">
                    <EText
                      as="span"
                      value={point}
                      onChange={(text) => {
                        const points = [...capability.points];
                        points[index] = text;
                        update("capability", { ...capability, points });
                      }}
                    />
                    <button
                      type="button"
                      className="ve-mini-btn"
                      onClick={() =>
                        update("capability", {
                          ...capability,
                          points: capability.points.filter((_, i) => i !== index),
                        })
                      }
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="ve-add-btn"
                onClick={() =>
                  update("capability", {
                    ...capability,
                    points: [...capability.points, "New point"],
                  })
                }
              >
                + Add point
              </button>
            </div>
          </div>
        </section>

        <section className="section section-compact ve-block" id="certificates">
          <SectionLabel>Certificates</SectionLabel>
          <div className="cert-band">
            <div className="cert-intro">
              <EText
                as="p"
                className="eyebrow"
                value={certificates.eyebrow}
                onChange={(eyebrow) => update("certificates", { ...certificates, eyebrow })}
              />
              <EText
                as="h2"
                value={certificates.title}
                onChange={(title) => update("certificates", { ...certificates, title })}
              />
              <EText
                as="p"
                value={certificates.lead}
                multiline
                onChange={(lead) => update("certificates", { ...certificates, lead })}
              />
            </div>
            <div className="cert-strip">
              {certificates.items.map((item, index) => (
                <figure className="cert-chip ve-card" key={item.id}>
                  <button
                    type="button"
                    className="ve-remove"
                    onClick={() =>
                      update("certificates", {
                        ...certificates,
                        items: certificates.items.filter((_, i) => i !== index),
                      })
                    }
                  >
                    Remove
                  </button>
                  <EImage
                    className="cert-thumb"
                    value={item.thumb}
                    onChange={(thumb) => {
                      const items = [...certificates.items];
                      items[index] = { ...item, thumb };
                      update("certificates", { ...certificates, items });
                    }}
                    label="Cert"
                  />
                  <EText
                    as="p"
                    value={item.label}
                    onChange={(label) => {
                      const items = [...certificates.items] as CertificateItem[];
                      items[index] = { ...item, label };
                      update("certificates", { ...certificates, items });
                    }}
                  />
                </figure>
              ))}
            </div>
          </div>
          <button
            type="button"
            className="ve-add-btn ve-add-wide"
            onClick={() =>
              update("certificates", {
                ...certificates,
                items: [
                  ...certificates.items,
                  { id: newId(), label: "New certificate", thumb: "", href: "" },
                ],
              })
            }
          >
            + Add certificate
          </button>
        </section>

        <section className="section section-compact ve-block" id="contact">
          <SectionLabel>Contact</SectionLabel>
          <div className="contact-panel">
            <div>
              <EText
                as="p"
                className="eyebrow"
                value={contact.eyebrow}
                onChange={(eyebrow) => update("contact", { ...contact, eyebrow })}
              />
              <EText
                as="h2"
                value={contact.title}
                onChange={(title) => update("contact", { ...contact, title })}
              />
              <EText
                as="p"
                value={contact.body}
                multiline
                onChange={(body) => update("contact", { ...contact, body })}
              />
              <ul className="contact-meta">
                <li>
                  <span>Email</span>
                  <EText
                    as="span"
                    value={contact.email}
                    onChange={(email) => update("contact", { ...contact, email })}
                  />
                </li>
                <li>
                  <span>Phone</span>
                  <EText
                    as="span"
                    value={contact.phone}
                    onChange={(phone) => update("contact", { ...contact, phone })}
                  />
                </li>
                <li>
                  <span>WhatsApp</span>
                  <EText
                    as="span"
                    value={contact.whatsapp}
                    onChange={(whatsapp) => update("contact", { ...contact, whatsapp })}
                  />
                </li>
              </ul>
            </div>
            <div className="ve-form-note">
              Enquiry form stays as-is for visitors. Edit contact details on the left.
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer ve-block">
        <SectionLabel>Footer</SectionLabel>
        <div className="footer-brand">
          <EText
            as="strong"
            value={footer.companyName}
            onChange={(companyName) => update("footer", { ...footer, companyName })}
          />
          <EText
            as="span"
            value={footer.tagline}
            onChange={(tagline) => update("footer", { ...footer, tagline })}
          />
        </div>
        <EText
          as="p"
          className="footer-copy"
          value={footer.copyright}
          onChange={(copyright) => update("footer", { ...footer, copyright })}
        />
      </footer>
    </div>
  );
}
