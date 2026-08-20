import type { Metadata } from "next";
import { renderPageDocument } from "@/lib/render-page";

export const metadata: Metadata = {
  title: "FM Global (FM) Approval | United Panel-System",
};

export const dynamic = "force-dynamic";

export default async function FmGlobalPage() {
  return renderPageDocument("about/certified/fm-global");
}
