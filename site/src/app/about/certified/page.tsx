import type { Metadata } from "next";
import { renderPageDocument } from "@/lib/render-page";

export const metadata: Metadata = {
  title: "Certified Quality | United Panel-System",
};

export const dynamic = "force-dynamic";

export default async function CertifiedHubPage() {
  return renderPageDocument("about/certified");
}
