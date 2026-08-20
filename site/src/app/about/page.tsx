import type { Metadata } from "next";
import { renderPageDocument } from "@/lib/render-page";

export const metadata: Metadata = {
  title: "About Us | United Panel-System",
  description:
    "Company profile, vision & mission, R&D, and certifications — United Panel-System (M) Sdn Bhd.",
};

export const dynamic = "force-dynamic";

export default async function AboutIndexPage() {
  return renderPageDocument("about");
}
