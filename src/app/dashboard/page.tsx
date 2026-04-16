"use client";

import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/client";
import { TokenReq } from "@/type/user";

export default function DashboardPage() {
  const router = useRouter();

  const onLogout = async () => {
    const req: TokenReq = { refreshToken: localStorage.getItem("refreshToken") ?? "" };
    try {
      await fetchApi("/api/users/logout", {
        method: "POST",
        body: JSON.stringify(req),
      });
    } catch {
      // 토큰이 만료되었거나 유효하지 않아도 로컬 토큰은 제거
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      router.push("/login");
    }
  };

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.5rem",
      }}
    >
      <p style={{ fontSize: "1.25rem", fontWeight: 600 }}>대시보드 (임시)</p>
      <button
        onClick={onLogout}
        style={{
          padding: "0.75rem 2rem",
          borderRadius: "0.5rem",
          background: "var(--accent-primary)",
          color: "#fff",
          fontWeight: 700,
          fontSize: "1rem",
          cursor: "pointer",
        }}
      >
        로그아웃
      </button>
    </div>
  );
}
