import type { Metadata } from "next";
import { renderPageDocument } from "@/lib/render-page";

export const metadata: Metadata = {
  title: "Refrigeration Parts | United Panel-System",
  description: "Authorised refrigeration parts and brand partners — United Panel-System.",
};

export const dynamic = "force-dynamic";

export default async function PartsPage() {
  return renderPageDocument("parts");
}
