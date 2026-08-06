import type { Metadata } from "next";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SITE_NAV } from "@/lib/nav";
import { defaultHomeContent } from "@/lib/defaults";

export const metadata: Metadata = {
  title: "Contact Us | United Panel-System",
  description: "Enquire about insulated panels, refrigeration parts, or advisory services.",
};

const contact = defaultHomeContent.contact;
const settings = defaultHomeContent.settings;
const footer = {
  ...defaultHomeContent.footer,
  tagline: "Contact Us",
};

export default function ContactPage() {
  return (
    <>
      <SiteHeader settings={settings} navItems={SITE_NAV} />
      <main>
        <section className="page-hero">
          <div className="page-hero-inner">
            <p className="eyebrow">{contact.eyebrow}</p>
            <h1>Contact Us</h1>
            <p className="section-lead">{contact.body}</p>
          </div>
        </section>

        <section className="section section-compact">
          <div className="contact-panel">
            <div>
              <h2>Reach our team</h2>
              <ul className="contact-meta">
                <li>
                  <span>Email</span>
                  {contact.email}
                </li>
                <li>
                  <span>Phone</span>
                  {contact.phone}
                </li>
                <li>
                  <span>WhatsApp</span>
                  {contact.whatsapp}
                </li>
              </ul>
            </div>
            <form className="contact-form" action="#" method="post">
              <label>
                Name
                <input name="name" required placeholder="Your name" />
              </label>
              <label>
                Company
                <input name="company" placeholder="Company name" />
              </label>
              <label>
                Email
                <input type="email" name="email" required placeholder="you@company.com" />
              </label>
              <label>
                Message
                <textarea name="message" rows={4} placeholder="Panels, parts, or advisory…" />
              </label>
              <button className="btn btn-primary" type="submit">
                Send enquiry
              </button>
            </form>
          </div>
        </section>
      </main>
      <SiteFooter footer={footer} />
    </>
  );
}
