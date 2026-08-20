import { renderPageDocument } from "@/lib/render-page";

export const dynamic = "force-dynamic";

export default async function Page() {
  return renderPageDocument("home");
}
