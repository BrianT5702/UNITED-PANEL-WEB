"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function EnquiryDeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className="ve-mini-btn"
      disabled={busy}
      onClick={async () => {
        if (!confirm("Delete this enquiry? This cannot be undone.")) return;
        setBusy(true);
        const res = await fetch(`/api/admin/enquiries?id=${encodeURIComponent(id)}`, { method: "DELETE" });
        setBusy(false);
        if (!res.ok) {
          alert("Could not delete it. Please try again.");
          return;
        }
        router.refresh();
      }}
    >
      {busy ? "Deleting…" : "Delete"}
    </button>
  );
}
