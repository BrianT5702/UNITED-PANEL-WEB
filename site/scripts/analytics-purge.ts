/**
 * Delete analytics older than the retention period (13 months by default).
 *   npm run analytics:purge            → keep the last 13 months
 *   npm run analytics:purge -- 6       → keep only the last 6 months
 */
import { PrismaClient } from "@prisma/client";

async function main() {
  const months = Math.max(1, Math.floor(Number(process.argv[2]) || 13));
  const prisma = new PrismaClient();
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  const events = await prisma.analyticsEvent.deleteMany({ where: { createdAt: { lt: cutoff } } });
  const views = await prisma.analyticsPageview.deleteMany({ where: { createdAt: { lt: cutoff } } });
  const sessions = await prisma.analyticsSession.deleteMany({ where: { lastSeenAt: { lt: cutoff } } });
  console.log(
    `Removed analytics older than ${months} months (before ${cutoff.toISOString()}): ` +
      `${sessions.count} visits, ${views.count} page views, ${events.count} events.`,
  );
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
