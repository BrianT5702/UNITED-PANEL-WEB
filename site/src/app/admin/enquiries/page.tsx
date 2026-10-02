import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { listEnquiries } from "@/lib/enquiries";
import { EnquiryDeleteButton } from "@/components/admin/EnquiryDeleteButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Enquiries | United Panel-System admin",
  robots: { index: false, follow: false },
};

function when(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur", dateStyle: "medium", timeStyle: "short" }) + " (MYT)";
}

export default async function AdminEnquiriesPage() {
  if (!(await isAuthenticated())) {
    redirect("/admin/login");
  }
  const items = await listEnquiries();
  return (
    <div className="admin-body">
      <div className="enq-admin">
        <div className="enq-admin-head">
          <div>
            <h1>Enquiries</h1>
            <p>
              Messages sent through the Contact page form. They are saved here only — nobody is emailed, so check this
              page regularly. {items.length} {items.length === 1 ? "message" : "messages"}.
            </p>
          </div>
          <Link className="btn btn-ghost" href="/admin/edit">
            ← Back to site editor
          </Link>
        </div>
        {items.length === 0 ? (
          <p className="enq-admin-empty">No enquiries yet.</p>
        ) : (
          <ul className="enq-admin-list">
            {items.map((e) => (
              <li key={e.id} className="enq-admin-item">
                <div className="enq-admin-top">
                  <strong>{e.subject}</strong>
                  <span>{when(e.createdAt)}</span>
                </div>
                <p className="enq-admin-meta">
                  {e.name}
                  {e.company ? ` · ${e.company}` : ""} ·{" "}
                  <a href={`mailto:${e.email}?subject=${encodeURIComponent(`Re: ${e.subject}`)}`}>{e.email}</a> ·{" "}
                  <a href={`tel:${e.phone.replace(/[^\d+]/g, "")}`}>{e.phone}</a>
                </p>
                {e.types?.length ? <p className="enq-admin-types">About: {e.types.join(", ")}</p> : null}
                <p className="enq-admin-msg">{e.message}</p>
                <EnquiryDeleteButton id={e.id} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
