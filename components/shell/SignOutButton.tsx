"use client";

import { LogOut } from "lucide-react";
import { apiClient } from "@/lib/api-client";

export function SignOutButton() {
  async function signOut() {
    try {
      await apiClient.auth.logout();
    } catch {
      // 后端会清 HttpOnly Cookie；网络错误不阻塞跳转。
    }
    window.location.href = "/login";
  }

  return (
    <button
      type="button"
      onClick={signOut}
      className="island-button h-10"
    >
      <LogOut className="size-4" />
      退出
    </button>
  );
}
