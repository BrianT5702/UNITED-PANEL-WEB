import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";

export default async function AdminIndexPage() {
  if (!(await isAuthenticated())) {
    redirect("/admin/login");
  }
  redirect("/admin/edit");
}
