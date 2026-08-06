import { ensureSeeded, getHomeContent } from "@/lib/content";
import { HomePage } from "@/components/site/HomePage";

export const dynamic = "force-dynamic";

export default async function Page() {
  await ensureSeeded();
  const content = await getHomeContent();
  return <HomePage content={content} />;
}
