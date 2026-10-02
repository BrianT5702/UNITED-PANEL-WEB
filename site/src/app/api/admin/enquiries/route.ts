import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { deleteEnquiry } from "@/lib/enquiries";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const id = new URL(request.url).searchParams.get("id") || "";
  if (!/^enq_[a-z0-9]+$/i.test(id)) {
    return NextResponse.json({ error: "Bad id" }, { status: 400 });
  }
  const ok = await deleteEnquiry(id);
  return NextResponse.json({ ok }, { status: ok ? 200 : 404 });
}
