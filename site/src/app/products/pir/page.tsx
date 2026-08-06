import type { Metadata } from "next";
import { ensureSeeded, getPirContent } from "@/lib/content";
import { PanelProductPage } from "@/components/site/PanelProductPage";

export const metadata: Metadata = {
  title: "PIR Panels | United Panel-System",
  description:
    "FM Approved polyisocyanurate (PIR) panels from ASEAN’s first and only continuous PIR line — United Panel-System Malaysia.",
};

export const dynamic = "force-dynamic";

export default async function Page() {
  await ensureSeeded();
  const content = await getPirContent();
  return <PanelProductPage content={content} />;
}
