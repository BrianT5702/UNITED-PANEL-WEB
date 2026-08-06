import type { Metadata } from "next";
import { PanelProductPage } from "@/components/site/PanelProductPage";
import { defaultPuContent } from "@/lib/panels";

export const metadata: Metadata = {
  title: "PU Panels | United Panel-System",
  description:
    "Polyurethane (PU) insulated panels — customisable thickness, joints and finishes for cold storage projects in Malaysia.",
};

export default function Page() {
  return <PanelProductPage content={defaultPuContent} />;
}
