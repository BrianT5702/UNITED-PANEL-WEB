import Link from "next/link";

export default async function ProductPlaceholder({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const title = slug.replace(/-/g, " ");

  return (
    <main className="section" style={{ paddingTop: "6rem" }}>
      <p className="eyebrow">Product</p>
      <h1 style={{ textTransform: "capitalize" }}>{title}</h1>
      <p className="section-lead">This product page is being prepared. Browse our main panel lines meanwhile.</p>
      <p>
        <Link className="text-link" href="/products/pir">
          PIR →
        </Link>{" "}
        <Link className="text-link" href="/products/pu">
          PU →
        </Link>{" "}
        <Link className="text-link" href="/products/rockwool">
          RockWool →
        </Link>
      </p>
      <Link className="text-link" href="/#products">
        ← Back to products
      </Link>
    </main>
  );
}
