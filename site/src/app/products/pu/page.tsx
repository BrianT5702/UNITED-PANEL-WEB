import type { Metadata } from "next";
import { renderPageDocument } from "@/lib/render-page";

export const metadata: Metadata = {
  title: "PU Panels | United Panel-System",
  description:
    "UR PU insulation panels — 50–250 mm cores, clip-lock / cam-lock joints, SIRIM-listed and Bomba-approved for cold storage. United Panel-System Malaysia.",
};

export const dynamic = "force-dynamic";

export default async function Page() {
  return renderPageDocument("products/pu");
}
