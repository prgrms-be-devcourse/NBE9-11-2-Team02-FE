"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { fetchApi } from "@/lib/client";
import { SignupReq } from "@/type/user";
import RegisterSuccessModal from "@/components/RegisterSuccessModal";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<SignupReq>({
    username: "",
    password: "",
    passwordConfirm: "",
    nickname: "",
  });
  const [error, setError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await fetchApi("/api/users/signup", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setShowSuccessModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "회원가입에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {showSuccessModal && (
        <RegisterSuccessModal onConfirm={() => router.push("/login")} />
      )}
      <h1
        style={{
          fontSize: "1.5rem",
          fontWeight: 700,
          marginBottom: "2rem",
          textAlign: "center",
          color: "var(--text-primary)",
        }}
      >
        회원가입
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
        <input
          type="password"
          name="passwordConfirm"
          placeholder="비밀번호 확인"
          value={form.passwordConfirm}
          onChange={onChange}
          required
          style={inputStyle}
        />
        <input
          type="text"
          name="nickname"
          placeholder="닉네임"
          value={form.nickname}
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
          {isLoading ? "처리 중..." : "회원가입"}
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
        이미 계정이 있으신가요?{" "}
        <Link href="/login" style={{ color: "var(--accent-primary)", fontWeight: 600 }}>
          로그인
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
