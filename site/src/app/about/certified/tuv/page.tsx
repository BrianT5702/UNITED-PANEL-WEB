import type { Metadata } from "next";
import { renderPageDocument } from "@/lib/render-page";

export const metadata: Metadata = {
  title: "TÜV Fire Classification | United Panel-System",
};

export const dynamic = "force-dynamic";

export default async function TuvPage() {
  return renderPageDocument("about/certified/tuv");
}
