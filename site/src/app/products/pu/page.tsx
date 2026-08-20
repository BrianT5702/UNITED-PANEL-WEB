import type { Metadata } from "next";
import { renderPageDocument } from "@/lib/render-page";

export const metadata: Metadata = {
  title: "PU Panels | United Panel-System",
  description:
    "Customisable polyurethane (PU) insulated panels for cold storage — United Panel-System Malaysia.",
};

export const dynamic = "force-dynamic";

export default async function Page() {
  return renderPageDocument("products/pu");
}
