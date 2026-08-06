"use client";

import { useState } from "react";

export function ImageField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function onFile(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError("");
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body });
    setUploading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Upload failed");
      return;
    }
    const data = await res.json();
    onChange(data.url);
  }

  return (
    <div className="admin-field">
      <label>{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="/uploads/… or https://…" />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        disabled={uploading}
      />
      {uploading ? <span style={{ color: "var(--steel)", fontSize: "0.85rem" }}>Uploading…</span> : null}
      {error ? <div className="admin-msg admin-error">{error}</div> : null}
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="admin-preview-img" src={value} alt="" />
      ) : null}
    </div>
  );
}
