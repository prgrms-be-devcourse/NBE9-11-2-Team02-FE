"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { fetchApi } from "@/lib/client";
import { LoginReq, UsersRes } from "@/type/user";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState<LoginReq>({ username: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await fetchApi("/api/users/login", {
        method: "POST",
        body: JSON.stringify(form),
      });
      localStorage.setItem("accessToken", res.data.accessToken);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
    
      {/* 1. 로고 영역: 로그인 텍스트 위로 이동 및 세로 중앙 정렬 */}
      <div 
        style={{
          display: 'flex',
          flexDirection: 'column', // 이미지와 텍스트를 위아래로 배치
          alignItems: 'center',    // 가로 중앙 정렬
          justifyContent: 'center',
          marginBottom: '1.5rem',  // 아래 '로그인' 타이틀과의 간격
        }}
      >
        <Image
          src="/icon/TwoGetMore_3.png"
          alt="TwoGetMore 로고"
          width={120}  /* 💡 기존 70에서 120으로 크기 대폭 확대 */
          height={120}
        />
        <span 
          style={{ 
            marginTop: '12px', /* 💡 이미지와 글자 사이 간격 */
            fontSize: '1.75rem', 
            fontWeight: '900', 
            color: 'var(--text-primary)' 
          }}
        >
          TwoGetMore
        </span>
      </div>

      {/* 2. 로그인 타이틀 */}
      <h1
        style={{
          fontSize: "1.2rem",
          fontWeight: 600,
          marginBottom: "2rem",
          textAlign: "center",
          color: "var(--text-secondary)", // 로고가 더 돋보이도록 타이틀 색상을 살짝 부드럽게 조정 (필요시 primary로 복구 가능)
        }}
      >
        로그인
      </h1>

      <form
        onSubmit={onSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
      >
        <input
          type="text"
          name="username"
          placeholder="아이디"
          value={form.username}
          onChange={onChange}
          required
          style={inputStyle}
        />
        <input
          type="password"
          name="password"
          placeholder="비밀번호"
          value={form.password}
          onChange={onChange}
          required
          style={inputStyle}
        />

        {error && (
          <p style={{ color: "var(--price-up)", fontSize: "0.875rem", textAlign: "center" }}>
            {error}
          </p>
        )}

        <button type="submit" disabled={isLoading} style={buttonStyle}>
          {isLoading ? "로그인 중..." : "로그인"}
        </button>
      </form>

      <p
        style={{
          marginTop: "1.5rem",
          textAlign: "center",
          fontSize: "0.875rem",
          color: "var(--text-tertiary)",
        }}
      >
        계정이 없으신가요?{" "}
        <Link href="/register" style={{ color: "var(--accent-primary)", fontWeight: 600 }}>
          회원가입
        </Link>
      </p>
    </>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "0.75rem 1rem",
  borderRadius: "0.5rem",
  border: "1px solid var(--border-soft)",
  background: "var(--bg-card)",
  fontSize: "1rem",
  color: "var(--text-primary)",
  outline: "none",
  width: "100%",
};

const buttonStyle: React.CSSProperties = {
  marginTop: "0.5rem",
  padding: "0.875rem",
  borderRadius: "0.5rem",
  background: "var(--accent-primary)",
  color: "#fff",
  fontWeight: 700,
  fontSize: "1rem",
  cursor: "pointer",
};
