import type { Metadata } from "next";
import { renderPageDocument } from "@/lib/render-page";

export const metadata: Metadata = {
  title: "Partners | United Panel-System",
  description: "Brand partners for refrigeration parts — United Panel-System.",
};

export const dynamic = "force-dynamic";

export default async function PartnersPage() {
  return renderPageDocument("partners");
}
