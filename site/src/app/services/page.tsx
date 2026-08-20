import type { Metadata } from "next";
import { renderPageDocument } from "@/lib/render-page";

export const metadata: Metadata = {
  title: "Services | United Panel-System",
  description: "Advisory and cold storage project support from United Panel-System.",
};

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  return renderPageDocument("services");
}
