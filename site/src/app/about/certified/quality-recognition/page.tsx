import type { Metadata } from "next";
import { renderPageDocument } from "@/lib/render-page";

export const metadata: Metadata = {
  title: "ISO, SIRIM & Bomba | United Panel-System",
};

export const dynamic = "force-dynamic";

export default async function QualityRecognitionPage() {
  return renderPageDocument("about/certified/quality-recognition");
}
