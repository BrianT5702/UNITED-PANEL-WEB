import type { Metadata } from "next";
import { renderPageDocument } from "@/lib/render-page";

export const metadata: Metadata = {
  title: "Career | United Panel-System",
  description: "Career opportunities at United Panel-System.",
};

export const dynamic = "force-dynamic";

export default async function CareerPage() {
  return renderPageDocument("career");
}
