"use client";

interface Props {
  onConfirm: () => void;
}

export default function RegisterSuccessModal({ onConfirm }: Props) {
  return (
    <div style={backdropStyle}>
      <div style={modalStyle}>
        <h1 style={titleStyle}>회원가입 완료</h1>
        <p style={descStyle}>
          환영합니다!
          <br />
          귀하의 계정이 성공적으로 생성되었습니다.
          <br />
          <span style={{ fontWeight: 700, color: "var(--accent-primary)" }}>
            예수금 5천만원이 지급되었습니다.
          </span>
        </p>
        <button style={buttonStyle} onClick={onConfirm}>
          로그인하러 가기
        </button>
        <div style={gradientBarStyle} />
      </div>
    </div>
  );
}

const backdropStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(17, 28, 50, 0.4)",
  backdropFilter: "blur(4px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 50,
};

const modalStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "24rem",
  background: "var(--mobile-surface)",
  borderRadius: "0.75rem",
  boxShadow: "0 20px 50px rgba(17,28,50,0.12)",
  overflow: "hidden",
  padding: "2.5rem 2rem 0",
  textAlign: "center",
};

const titleStyle: React.CSSProperties = {
  fontSize: "1.5rem",
  fontWeight: 800,
  color: "var(--text-primary)",
  marginBottom: "0.75rem",
};

const descStyle: React.CSSProperties = {
  fontSize: "0.9375rem",
  lineHeight: 1.7,
  color: "var(--text-secondary)",
  marginBottom: "2rem",
};

const buttonStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.875rem",
  borderRadius: "0.5rem",
  background: "var(--accent-primary)",
  color: "#fff",
  fontWeight: 700,
  fontSize: "1rem",
  cursor: "pointer",
  marginBottom: "2rem",
};

const gradientBarStyle: React.CSSProperties = {
  height: "4px",
  background: "linear-gradient(to right, var(--price-down), var(--accent-primary), var(--price-up))",
  margin: "0 -2rem",
};
