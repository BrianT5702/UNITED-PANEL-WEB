import type { Metadata } from "next";
import { renderPageDocument } from "@/lib/render-page";

export const metadata: Metadata = {
  title: "Products | United Panel-System",
  description:
    "United Panels — PIR, PU and RockWool insulated panels. Overview, material guidance and links to full specifications.",
};

export const dynamic = "force-dynamic";

export default async function ProductsHubPage() {
  return renderPageDocument("products");
}
