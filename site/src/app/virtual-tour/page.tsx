import type { Metadata } from "next";
import { renderPageDocument } from "@/lib/render-page";

export const metadata: Metadata = {
  title: "Virtual Tour | United Panel-System",
  description:
    "Project site tour — cold storage insulation panels, emergency facilities, and vaccine storage with FM Approved panels.",
};

export const dynamic = "force-dynamic";

export default async function VirtualTourPage() {
  return renderPageDocument("virtual-tour");
}
