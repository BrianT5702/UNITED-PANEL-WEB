import type { Metadata } from "next";
import { renderPageDocument } from "@/lib/render-page";

export const metadata: Metadata = {
  title: "Research & Development | United Panel-System",
};

export const dynamic = "force-dynamic";

export default async function ResearchDevelopmentPage() {
  return renderPageDocument("about/research-development");
}
