export default function ColorTokenExample() {
  return (
    <section
      style={{
        backgroundColor: "var(--bg-section)",
        minHeight: "100%",
        padding: "1.5rem 1.25rem",
      }}
    >
      <h1
        style={{
          fontSize: "1.25rem",
          color: "var(--text-primary)",
          marginBottom: "0.5rem",
        }}
      >
        모바일 UI 초기 세팅
      </h1>
      <p style={{ color: "var(--text-tertiary)", marginBottom: "1rem" }}>
        CSS 변수 기반 컬러 토큰과 26.875rem(기준 430px) 모바일 프레임이 적용되었습니다.
      </p>

      <div
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border-soft)",
          borderRadius: "0.75rem",
          padding: "1rem",
          marginBottom: "1rem",
        }}
      >
        <p style={{ color: "var(--text-secondary)", marginBottom: "0.375rem" }}>
          삼성전자
        </p>
        <p style={{ color: "var(--price-up)", fontWeight: 700, marginBottom: "0.125rem" }}>
          +2.31%
        </p>
        <p style={{ color: "var(--price-down)", fontWeight: 700 }}>-1.02%</p>
      </div>

      <button
        type="button"
        style={{
          backgroundColor: "var(--accent-primary)",
          color: "#ffffff",
          borderRadius: "0.625rem",
          padding: "0.75rem 0.875rem",
          fontWeight: 600,
        }}
      >
        포인트 버튼 예시
      </button>
    </section>
  );
}
