"use client";

import { useRouter } from "next/navigation";

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      className={["btn", "btn-ghost", className].filter(Boolean).join(" ")}
      type="button"
      onClick={logout}
    >
      Log out
    </button>
  );
}
