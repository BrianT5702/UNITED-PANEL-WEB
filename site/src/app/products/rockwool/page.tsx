import type { Metadata } from "next";
import { renderPageDocument } from "@/lib/render-page";

export const metadata: Metadata = {
  title: "RockWool Panels | United Panel-System",
  description:
    "Malaysia’s first fully automated RockWool production line — insulated panels for cold rooms, food facilities, and data centres.",
};

export const dynamic = "force-dynamic";

export default async function Page() {
  return renderPageDocument("products/rockwool");
}
