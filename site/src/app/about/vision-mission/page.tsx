import type { Metadata } from "next";
import { renderPageDocument } from "@/lib/render-page";

export const metadata: Metadata = {
  title: "Vision & Mission | United Panel-System",
};

export const dynamic = "force-dynamic";

export default async function VisionMissionPage() {
  return renderPageDocument("about/vision-mission");
}
