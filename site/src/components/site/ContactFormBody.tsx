"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { cleanSubject, CONTACT_SUBJECT_MAX, type ContactFormSectionData } from "@/lib/page-document";

type Status = "idle" | "sending" | "sent" | "error";

/** The form itself. `preview` = editor view (same markup, not clickable). */
export function ContactFormFields({
  data,
  initialSubject = "",
  preview = false,
}: {
  data: Pick<ContactFormSectionData, "enquiryTypes" | "submitLabel" | "successMessage">;
  initialSubject?: string;
  preview?: boolean;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [badField, setBadField] = useState("");
  const [types, setTypes] = useState<string[]>([]);
  const [subject, setSubject] = useState(initialSubject);
  const ro = preview ? { readOnly: true, tabIndex: -1 } : {};

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (preview || status === "sending") return;
    const form = e.currentTarget;
    const f = new FormData(form);
    setStatus("sending");
    setError("");
    setBadField("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: f.get("name"),
          company: f.get("company"),
          email: f.get("email"),
          phone: f.get("phone"),
          subject,
          message: f.get("message"),
          types,
          website: f.get("website"),
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string; field?: string };
      if (!res.ok) {
        setStatus("error");
        setError(json.error || "Sorry, something went wrong. Please try again.");
        setBadField(json.field || "");
        return;
      }
      setStatus("sent");
      form.reset();
      setTypes([]);
    } catch {
      setStatus("error");
      setError("Could not reach the server. Please check your connection and try again.");
    }
  }

  if (status === "sent") {
    return (
      <div className="enq-sent" role="status">
        <strong>Message sent</strong>
        <p>{data.successMessage || "Thank you — your message has been sent."}</p>
        <button type="button" className="btn btn-ghost" onClick={() => setStatus("idle")}>
          Send another message
        </button>
      </div>
    );
  }

  const bad = (name: string) => (badField === name ? { "aria-invalid": true as const } : {});

  return (
    <form className="enq-form" onSubmit={onSubmit} noValidate={false} data-preview={preview ? "true" : undefined}>
      <div className="enq-grid">
        <label className="enq-field">
          <span>Name *</span>
          <input name="name" type="text" required maxLength={100} autoComplete="name" {...ro} {...bad("name")} />
        </label>
        <label className="enq-field">
          <span>Company name</span>
          <input name="company" type="text" maxLength={120} autoComplete="organization" {...ro} />
        </label>
        <label className="enq-field">
          <span>Email address *</span>
          <input name="email" type="email" required maxLength={160} autoComplete="email" {...ro} {...bad("email")} />
        </label>
        <label className="enq-field">
          <span>Telephone no. *</span>
          <input
            name="phone"
            type="tel"
            required
            maxLength={25}
            autoComplete="tel"
            inputMode="tel"
            {...ro}
            {...bad("phone")}
          />
        </label>
      </div>

      {data.enquiryTypes.length > 0 ? (
        <fieldset className="enq-types">
          <legend>Enquiry about</legend>
          <div className="enq-chips">
            {data.enquiryTypes.map((t) => (
              <label key={t} className="enq-chip">
                <input
                  type="checkbox"
                  checked={types.includes(t)}
                  tabIndex={preview ? -1 : undefined}
                  onChange={(e) =>
                    setTypes((cur) => (e.target.checked ? [...cur, t] : cur.filter((x) => x !== t)))
                  }
                />
                <span>{t}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      <label className="enq-field">
        <span>Subject *</span>
        <input
          name="subject"
          type="text"
          required
          maxLength={CONTACT_SUBJECT_MAX}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          {...(preview ? { readOnly: true, tabIndex: -1 } : {})}
          {...bad("subject")}
        />
      </label>
      <label className="enq-field">
        <span>Message *</span>
        <textarea name="message" required rows={6} maxLength={4000} {...ro} {...bad("message")} />
      </label>

      {/* Hidden from people; bots tend to fill it in */}
      <div className="enq-hp" aria-hidden="true">
        <label>
          Website
          <input name="website" type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {error ? (
        <p className="enq-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="enq-actions">
        <button className="btn btn-primary" type="submit" disabled={status === "sending"} tabIndex={preview ? -1 : undefined}>
          {status === "sending" ? "Sending…" : data.submitLabel || "Send message"}
        </button>
      </div>
    </form>
  );
}

function LiveForm({ data }: { data: ContactFormSectionData }) {
  const params = useSearchParams();
  return <ContactFormFields data={data} initialSubject={cleanSubject(params.get("subject"))} />;
}

/** Live site: pre-fills Subject from ?subject= (cleaned + length-limited; still editable) */
export function ContactFormLive({ data }: { data: ContactFormSectionData }) {
  return (
    <Suspense fallback={<ContactFormFields data={data} preview />}>
      <LiveForm data={data} />
    </Suspense>
  );
}
