import styles from "./color-token-example.module.css";

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
            <p style={{color: "var(--text-tertiary)", marginBottom: "1rem"}}>
                CSS 변수 기반 컬러 토큰과 26.875rem(기준 430px) 모바일 프레임이 적용되었습니다.
            </p>

            {/* 종목 카드 */}
            <div
                style={{
                    backgroundColor: "var(--bg-card)",
                    borderRadius: "0.75rem",
                    padding: "1rem",
                    marginBottom: "1rem",
                }}
            >
                <p style={{color: "var(--text-secondary)", marginBottom: "0.375rem"}}>
                    삼성전자
                </p>
                <p style={{color: "var(--price-up)", fontWeight: 700, marginBottom: "0.125rem"}}>
                    +2.31%
                </p>
                <p style={{color: "var(--price-down)", fontWeight: 700}}>-1.02%</p>
            </div>

            {/* 포인트 버튼 */}
            <button type="button" className={styles.accentBtn}>
                포인트 버튼 예시
            </button>

            {/* 매수 / 매도 버튼 */}
            <div className={styles.tradeRow}>
                <button type="button" className={styles.buyBtn}>매수</button>
                <button type="button" className={styles.sellBtn}>매도</button>
            </div>
        </section>
    );
}
