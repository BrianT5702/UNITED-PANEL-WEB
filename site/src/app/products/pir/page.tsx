import type { Metadata } from "next";
import { renderPageDocument } from "@/lib/render-page";

export const metadata: Metadata = {
  title: "PIR Panels | United Panel-System",
  description:
    "FM Approved polyisocyanurate (PIR) panels from ASEAN’s first and only continuous PIR line — United Panel-System Malaysia.",
};

export const dynamic = "force-dynamic";

export default async function Page() {
  return renderPageDocument("products/pir");
}
