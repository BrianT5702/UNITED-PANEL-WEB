"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { HomeContent, HomeSectionKey } from "@/lib/types";
import { ImageField } from "./ImageField";

function newId() {
  return `id_${Math.random().toString(36).slice(2, 10)}`;
}

function Field({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <div className="admin-field">
      <label>{label}</label>
      {multiline ? (
        <textarea rows={4} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}

export function SectionEditor({
  sectionKey,
  initialData,
}: {
  sectionKey: HomeSectionKey;
  initialData: HomeContent[HomeSectionKey];
}) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const title = useMemo(() => sectionKey, [sectionKey]);

  async function save() {
    setSaving(true);
    setMessage("");
    setError("");
    const res = await fetch("/api/admin/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: sectionKey, data }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Could not save. Check you are still logged in.");
      return;
    }
    setMessage("Saved. Homepage will show the update.");
    router.refresh();
  }

  function moveItem<T>(items: T[], index: number, dir: -1 | 1) {
    const next = index + dir;
    if (next < 0 || next >= items.length) return items;
    const copy = [...items];
    const tmp = copy[index];
    copy[index] = copy[next];
    copy[next] = tmp;
    return copy;
  }

  return (
    <div className="admin-form">
      <p style={{ color: "var(--steel)", fontSize: "0.9rem" }}>
        Editing <strong style={{ color: "var(--text)" }}>{title}</strong>. Change text and images here —
        layout stays fixed.
      </p>

      {sectionKey === "settings" && (
        <>
          <Field
            label="Site name"
            value={(data as HomeContent["settings"]).siteName}
            onChange={(siteName) => setData({ ...(data as HomeContent["settings"]), siteName })}
          />
          <ImageField
            label="Logo image"
            value={(data as HomeContent["settings"]).logoUrl}
            onChange={(logoUrl) => setData({ ...(data as HomeContent["settings"]), logoUrl })}
          />
        </>
      )}

      {sectionKey === "nav" && (
        <>
          {(data as HomeContent["nav"]).items.map((item, index) => (
            <div className="admin-list-item" key={`${item.label}-${index}`}>
              <Field
                label="Label"
                value={item.label}
                onChange={(label) => {
                  const items = [...(data as HomeContent["nav"]).items];
                  items[index] = { ...item, label };
                  setData({ items });
                }}
              />
              <Field
                label="Link"
                value={item.href}
                onChange={(href) => {
                  const items = [...(data as HomeContent["nav"]).items];
                  items[index] = { ...item, href };
                  setData({ items });
                }}
              />
              <div className="admin-list-toolbar">
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() =>
                    setData({ items: moveItem((data as HomeContent["nav"]).items, index, -1) })
                  }
                >
                  Move up
                </button>
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() =>
                    setData({ items: moveItem((data as HomeContent["nav"]).items, index, 1) })
                  }
                >
                  Move down
                </button>
                <button
                  className="btn btn-danger"
                  type="button"
                  onClick={() =>
                    setData({
                      items: (data as HomeContent["nav"]).items.filter((_, i) => i !== index),
                    })
                  }
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() =>
              setData({
                items: [...(data as HomeContent["nav"]).items, { label: "New link", href: "/" }],
              })
            }
          >
            Add nav link
          </button>
        </>
      )}

      {sectionKey === "hero" && (
        <>
          {(["brand", "headline", "lead", "primaryCtaLabel", "primaryCtaHref", "secondaryCtaLabel", "secondaryCtaHref", "mediaLabel"] as const).map(
            (field) => (
              <Field
                key={field}
                label={field}
                value={(data as HomeContent["hero"])[field]}
                multiline={field === "lead"}
                onChange={(v) => setData({ ...(data as HomeContent["hero"]), [field]: v })}
              />
            )
          )}
          <ImageField
            label="Background image"
            value={(data as HomeContent["hero"]).backgroundImage}
            onChange={(backgroundImage) =>
              setData({ ...(data as HomeContent["hero"]), backgroundImage })
            }
          />
        </>
      )}

      {sectionKey === "proof" && (
        <>
          {(data as HomeContent["proof"]).items.map((item, index) => (
            <div className="admin-list-item" key={item.id}>
              <Field
                label="Index label"
                value={item.index}
                onChange={(indexLabel) => {
                  const items = [...(data as HomeContent["proof"]).items];
                  items[index] = { ...item, index: indexLabel };
                  setData({ items });
                }}
              />
              <Field
                label="Title"
                value={item.title}
                onChange={(titleText) => {
                  const items = [...(data as HomeContent["proof"]).items];
                  items[index] = { ...item, title: titleText };
                  setData({ items });
                }}
              />
              <Field
                label="Text"
                value={item.text}
                multiline
                onChange={(text) => {
                  const items = [...(data as HomeContent["proof"]).items];
                  items[index] = { ...item, text };
                  setData({ items });
                }}
              />
              <div className="admin-list-toolbar">
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() =>
                    setData({ items: moveItem((data as HomeContent["proof"]).items, index, -1) })
                  }
                >
                  Move up
                </button>
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() =>
                    setData({ items: moveItem((data as HomeContent["proof"]).items, index, 1) })
                  }
                >
                  Move down
                </button>
                <button
                  className="btn btn-danger"
                  type="button"
                  onClick={() =>
                    setData({
                      items: (data as HomeContent["proof"]).items.filter((_, i) => i !== index),
                    })
                  }
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() =>
              setData({
                items: [
                  ...(data as HomeContent["proof"]).items,
                  { id: newId(), index: "0", title: "New point", text: "Describe this highlight." },
                ],
              })
            }
          >
            Add proof point
          </button>
        </>
      )}

      {sectionKey === "products" && (
        <>
          <Field
            label="Eyebrow"
            value={(data as HomeContent["products"]).eyebrow}
            onChange={(eyebrow) => setData({ ...(data as HomeContent["products"]), eyebrow })}
          />
          <Field
            label="Title"
            value={(data as HomeContent["products"]).title}
            onChange={(titleText) => setData({ ...(data as HomeContent["products"]), title: titleText })}
          />
          <Field
            label="Lead"
            value={(data as HomeContent["products"]).lead}
            multiline
            onChange={(lead) => setData({ ...(data as HomeContent["products"]), lead })}
          />
          {(data as HomeContent["products"]).items.map((item, index) => (
            <div className="admin-list-item" key={item.id}>
              <Field
                label="Product title"
                value={item.title}
                onChange={(titleText) => {
                  const items = [...(data as HomeContent["products"]).items];
                  items[index] = { ...item, title: titleText };
                  setData({ ...(data as HomeContent["products"]), items });
                }}
              />
              <Field
                label="Text"
                value={item.text}
                multiline
                onChange={(text) => {
                  const items = [...(data as HomeContent["products"]).items];
                  items[index] = { ...item, text };
                  setData({ ...(data as HomeContent["products"]), items });
                }}
              />
              <Field
                label="Link"
                value={item.href}
                onChange={(href) => {
                  const items = [...(data as HomeContent["products"]).items];
                  items[index] = { ...item, href };
                  setData({ ...(data as HomeContent["products"]), items });
                }}
              />
              <ImageField
                label="Image"
                value={item.image}
                onChange={(image) => {
                  const items = [...(data as HomeContent["products"]).items];
                  items[index] = { ...item, image };
                  setData({ ...(data as HomeContent["products"]), items });
                }}
              />
              <div className="admin-list-toolbar">
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() =>
                    setData({
                      ...(data as HomeContent["products"]),
                      items: moveItem((data as HomeContent["products"]).items, index, -1),
                    })
                  }
                >
                  Move up
                </button>
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() =>
                    setData({
                      ...(data as HomeContent["products"]),
                      items: moveItem((data as HomeContent["products"]).items, index, 1),
                    })
                  }
                >
                  Move down
                </button>
                <button
                  className="btn btn-danger"
                  type="button"
                  onClick={() =>
                    setData({
                      ...(data as HomeContent["products"]),
                      items: (data as HomeContent["products"]).items.filter((_, i) => i !== index),
                    })
                  }
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() =>
              setData({
                ...(data as HomeContent["products"]),
                items: [
                  ...(data as HomeContent["products"]).items,
                  {
                    id: newId(),
                    title: "New product",
                    text: "Short description.",
                    image: "",
                    href: "#",
                  },
                ],
              })
            }
          >
            Add product card
          </button>
        </>
      )}

      {(sectionKey === "parts" || sectionKey === "services") && (
        <>
          <Field
            label="Eyebrow"
            value={(data as HomeContent["parts"]).eyebrow}
            onChange={(eyebrow) => setData({ ...(data as HomeContent["parts"]), eyebrow })}
          />
          <Field
            label="Title"
            value={(data as HomeContent["parts"]).title}
            onChange={(titleText) => setData({ ...(data as HomeContent["parts"]), title: titleText })}
          />
          <Field
            label="Lead"
            value={(data as HomeContent["parts"]).lead}
            multiline
            onChange={(lead) => setData({ ...(data as HomeContent["parts"]), lead })}
          />
          {(data as HomeContent["parts"]).items.map((item, index) => (
            <div className="admin-list-item" key={item.id}>
              <Field
                label="Title"
                value={item.title}
                onChange={(titleText) => {
                  const items = [...(data as HomeContent["parts"]).items];
                  items[index] = { ...item, title: titleText };
                  setData({ ...(data as HomeContent["parts"]), items });
                }}
              />
              <Field
                label="Text"
                value={item.text}
                multiline
                onChange={(text) => {
                  const items = [...(data as HomeContent["parts"]).items];
                  items[index] = { ...item, text };
                  setData({ ...(data as HomeContent["parts"]), items });
                }}
              />
              <Field
                label="Link"
                value={item.href}
                onChange={(href) => {
                  const items = [...(data as HomeContent["parts"]).items];
                  items[index] = { ...item, href };
                  setData({ ...(data as HomeContent["parts"]), items });
                }}
              />
              <ImageField
                label="Image"
                value={item.image}
                onChange={(image) => {
                  const items = [...(data as HomeContent["parts"]).items];
                  items[index] = { ...item, image };
                  setData({ ...(data as HomeContent["parts"]), items });
                }}
              />
              <div className="admin-list-toolbar">
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() =>
                    setData({
                      ...(data as HomeContent["parts"]),
                      items: moveItem((data as HomeContent["parts"]).items, index, -1),
                    })
                  }
                >
                  Move up
                </button>
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() =>
                    setData({
                      ...(data as HomeContent["parts"]),
                      items: moveItem((data as HomeContent["parts"]).items, index, 1),
                    })
                  }
                >
                  Move down
                </button>
                <button
                  className="btn btn-danger"
                  type="button"
                  onClick={() =>
                    setData({
                      ...(data as HomeContent["parts"]),
                      items: (data as HomeContent["parts"]).items.filter((_, i) => i !== index),
                    })
                  }
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() =>
              setData({
                ...(data as HomeContent["parts"]),
                items: [
                  ...(data as HomeContent["parts"]).items,
                  {
                    id: newId(),
                    title: "New item",
                    text: "Short description.",
                    image: "",
                    href: "#",
                  },
                ],
              })
            }
          >
            Add card
          </button>
        </>
      )}

      {sectionKey === "capability" && (
        <>
          {(["eyebrow", "title", "body", "ctaLabel", "ctaHref"] as const).map((field) => (
            <Field
              key={field}
              label={field}
              value={(data as HomeContent["capability"])[field]}
              multiline={field === "body"}
              onChange={(v) => setData({ ...(data as HomeContent["capability"]), [field]: v })}
            />
          ))}
          <ImageField
            label="Image"
            value={(data as HomeContent["capability"]).image}
            onChange={(image) => setData({ ...(data as HomeContent["capability"]), image })}
          />
          <div className="admin-field">
            <label>Bullet points (one per line)</label>
            <textarea
              rows={5}
              value={(data as HomeContent["capability"]).points.join("\n")}
              onChange={(e) =>
                setData({
                  ...(data as HomeContent["capability"]),
                  points: e.target.value.split("\n").filter(Boolean),
                })
              }
            />
          </div>
        </>
      )}

      {sectionKey === "certificates" && (
        <>
          <Field
            label="Eyebrow"
            value={(data as HomeContent["certificates"]).eyebrow}
            onChange={(eyebrow) => setData({ ...(data as HomeContent["certificates"]), eyebrow })}
          />
          <Field
            label="Title"
            value={(data as HomeContent["certificates"]).title}
            onChange={(titleText) =>
              setData({ ...(data as HomeContent["certificates"]), title: titleText })
            }
          />
          <Field
            label="Lead"
            value={(data as HomeContent["certificates"]).lead}
            multiline
            onChange={(lead) => setData({ ...(data as HomeContent["certificates"]), lead })}
          />
          {(data as HomeContent["certificates"]).items.map((item, index) => (
            <div className="admin-list-item" key={item.id}>
              <Field
                label="Label"
                value={item.label}
                onChange={(label) => {
                  const items = [...(data as HomeContent["certificates"]).items];
                  items[index] = { ...item, label };
                  setData({ ...(data as HomeContent["certificates"]), items });
                }}
              />
              <Field
                label="Link (optional)"
                value={item.href}
                onChange={(href) => {
                  const items = [...(data as HomeContent["certificates"]).items];
                  items[index] = { ...item, href };
                  setData({ ...(data as HomeContent["certificates"]), items });
                }}
              />
              <ImageField
                label="Thumbnail"
                value={item.thumb}
                onChange={(thumb) => {
                  const items = [...(data as HomeContent["certificates"]).items];
                  items[index] = { ...item, thumb };
                  setData({ ...(data as HomeContent["certificates"]), items });
                }}
              />
              <div className="admin-list-toolbar">
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() =>
                    setData({
                      ...(data as HomeContent["certificates"]),
                      items: moveItem((data as HomeContent["certificates"]).items, index, -1),
                    })
                  }
                >
                  Move up
                </button>
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() =>
                    setData({
                      ...(data as HomeContent["certificates"]),
                      items: moveItem((data as HomeContent["certificates"]).items, index, 1),
                    })
                  }
                >
                  Move down
                </button>
                <button
                  className="btn btn-danger"
                  type="button"
                  onClick={() =>
                    setData({
                      ...(data as HomeContent["certificates"]),
                      items: (data as HomeContent["certificates"]).items.filter((_, i) => i !== index),
                    })
                  }
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() =>
              setData({
                ...(data as HomeContent["certificates"]),
                items: [
                  ...(data as HomeContent["certificates"]).items,
                  { id: newId(), label: "New certificate", thumb: "", href: "" },
                ],
              })
            }
          >
            Add certificate
          </button>
        </>
      )}

      {sectionKey === "news" && (
        <>
          <div className="admin-field">
            <label>
              <input
                type="checkbox"
                checked={(data as HomeContent["news"]).visible}
                onChange={(e) =>
                  setData({ ...(data as HomeContent["news"]), visible: e.target.checked })
                }
              />{" "}
              Show news section on homepage
            </label>
          </div>
          <Field
            label="Eyebrow"
            value={(data as HomeContent["news"]).eyebrow}
            onChange={(eyebrow) => setData({ ...(data as HomeContent["news"]), eyebrow })}
          />
          <Field
            label="Title"
            value={(data as HomeContent["news"]).title}
            onChange={(titleText) => setData({ ...(data as HomeContent["news"]), title: titleText })}
          />
          {(data as HomeContent["news"]).items.map((item, index) => (
            <div className="admin-list-item" key={item.id}>
              <Field
                label="Date"
                value={item.date}
                onChange={(date) => {
                  const items = [...(data as HomeContent["news"]).items];
                  items[index] = { ...item, date };
                  setData({ ...(data as HomeContent["news"]), items });
                }}
              />
              <Field
                label="Title"
                value={item.title}
                onChange={(titleText) => {
                  const items = [...(data as HomeContent["news"]).items];
                  items[index] = { ...item, title: titleText };
                  setData({ ...(data as HomeContent["news"]), items });
                }}
              />
              <Field
                label="Link"
                value={item.href}
                onChange={(href) => {
                  const items = [...(data as HomeContent["news"]).items];
                  items[index] = { ...item, href };
                  setData({ ...(data as HomeContent["news"]), items });
                }}
              />
              <button
                className="btn btn-danger"
                type="button"
                onClick={() =>
                  setData({
                    ...(data as HomeContent["news"]),
                    items: (data as HomeContent["news"]).items.filter((_, i) => i !== index),
                  })
                }
              >
                Remove
              </button>
            </div>
          ))}
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() =>
              setData({
                ...(data as HomeContent["news"]),
                items: [
                  ...(data as HomeContent["news"]).items,
                  { id: newId(), date: "01/Jan/26", title: "New update", href: "#" },
                ],
              })
            }
          >
            Add news item
          </button>
        </>
      )}

      {sectionKey === "contact" && (
        <>
          {(["eyebrow", "title", "body", "email", "phone", "whatsapp"] as const).map((field) => (
            <Field
              key={field}
              label={field}
              value={(data as HomeContent["contact"])[field]}
              multiline={field === "body"}
              onChange={(v) => setData({ ...(data as HomeContent["contact"]), [field]: v })}
            />
          ))}
        </>
      )}

      {sectionKey === "footer" && (
        <>
          {(["companyName", "tagline", "copyright", "note"] as const).map((field) => (
            <Field
              key={field}
              label={field === "copyright" ? "Copyright (use {year} for year)" : field}
              value={(data as HomeContent["footer"])[field]}
              multiline={field === "note"}
              onChange={(v) => setData({ ...(data as HomeContent["footer"]), [field]: v })}
            />
          ))}
        </>
      )}

      {message ? <div className="admin-msg">{message}</div> : null}
      {error ? <div className="admin-msg admin-error">{error}</div> : null}

      <div className="admin-actions">
        <button className="btn btn-primary" type="button" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </button>
            <a className="btn btn-ghost" href="/admin/edit">
              Visual editor
            </a>
            <a className="btn btn-ghost" href="/admin/advanced">
              All sections
            </a>
        <a className="btn btn-ghost" href="/" target="_blank" rel="noreferrer">
          View homepage
        </a>
      </div>
    </div>
  );
}
