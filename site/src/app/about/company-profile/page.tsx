import type { Metadata } from "next";
import { renderPageDocument } from "@/lib/render-page";

export const metadata: Metadata = {
  title: "Company Profile | United Panel-System",
};

export const dynamic = "force-dynamic";

export default async function CompanyProfilePage() {
  return renderPageDocument("about/company-profile");
}
