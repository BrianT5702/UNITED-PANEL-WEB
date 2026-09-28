import type { Metadata } from "next";
import { renderPageDocument } from "@/lib/render-page";

export const metadata: Metadata = {
  title: "News | United Panel-System",
  description: "Company news and announcements from United Panel-System.",
};

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  return renderPageDocument("news");
}
