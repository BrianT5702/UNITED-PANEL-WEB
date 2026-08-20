import type { Metadata } from "next";
import { renderPageDocument } from "@/lib/render-page";

export const metadata: Metadata = {
  title: "Contact Us | United Panel-System",
  description: "Enquire about insulated panels, refrigeration parts, or advisory services.",
};

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  return renderPageDocument("contact");
}
