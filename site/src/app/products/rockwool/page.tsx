import type { Metadata } from "next";
import { RockWoolPage } from "@/components/site/RockWoolPage";

export const metadata: Metadata = {
  title: "RockWool Panels | United Panel-System",
  description:
    "Malaysia’s first fully automated RockWool production line — insulated panels for cold rooms, food facilities, and data centres.",
};

export default function Page() {
  return <RockWoolPage />;
}
