"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image"; // 💡 next/image 추가
import styles from "./guest-dashboard.module.css";
import BottomNav from "@/components/BottomNav"; // 추가

// 💡 로고 반환 유틸리티 함수 추가
const getLogo = (name: string) => {
  if (!name) return "/logos/default.svg";
  if (name.includes("삼성")) return "/logos/samsung.svg";
  if (name.includes("SK")) return "/logos/sk.svg";
  if (name.includes("LG")) return "/logos/lg.svg";
  if (name.includes("현대")) return "/logos/hyundai.svg";
  if (name.includes("카카오")) return "/logos/kakao.svg";
  if (name.includes("NAVER")) return "/logos/naver.svg";
  if (name.includes("KB")) return "/logos/kb.svg";
  if (name.includes("신한")) return "/logos/shinhan.svg";
  if (name.includes("포스코")) return "/logos/posco.svg";
  if (name.includes("셀트리온")) return "/logos/celltrion.svg";
  if (name.includes("한국전력")) return "/logos/kepco.svg";
  if (name.includes("하나")) return "/logos/hana.svg";
  return "/logos/default.svg";
};

export default function GuestDashboard() {
  const router = useRouter();
  const [topStocks, setTopStocks] = useState<any[]>([]);

  // 💡 1. 인증 상태 확인 전까지 빈 화면을 유지하기 위한 상태 추가
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // 💡 2. 마운트 직후 로컬 스토리지 검사 로직 추가
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      // 토큰이 있으면 뒤로가기 방지를 위해 replace로 대시보드 이동
      router.replace("/dashboard");
    } else {
      // 토큰이 없으면 로딩을 끝내고 게스트 화면 노출
      setIsCheckingAuth(false);
    }
  }, [router]);

  // 인증 확인 이후에만 SSE 연결 (훅은 항상 같은 순서로 호출되어야 하므로 early return 위에 둠)
  useEffect(() => {
    if (isCheckingAuth) return;

    const sseUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"}/api/stocks/sse`;
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (Array.isArray(data)) {
          setTopStocks(data.slice(0, 3));
        }
      } catch (e) {
        console.error("SSE 데이터 파싱 실패", e);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [isCheckingAuth]);

  // 💡 3. 인증 검사 중일 때는 화면 깜빡임(FOUC) 방지를 위해 렌더링을 지연시킴
  if (isCheckingAuth) {
    return <div className={styles.container} style={{ minHeight: '100vh' }} />; // 빈 화면 또는 스피너
  }

  return (
    <div className={styles.container}>
      {/* 1. 헤더 */}
      <header className={styles.header}>
        {/* 💡 대시보드와 동일하게 로고 이미지와 TwoGetMore 텍스트 적용 (겉 카드 배경 제거) */}
        <div
          className={styles.serviceName}
          style={{
            background: 'transparent',
            border: 'none',
            boxShadow: 'none',
            padding: 0,
            display: 'flex',      /* 💡 필수: 가로 정렬 */
            alignItems: 'center', /* 💡 필수: 로고와 텍스트의 세로 중앙을 맞춤 */
            height: '70px',       /* 💡 로고 높이와 맞춰서 영역 확보 */
            lineHeight: '1'       /* 💡 텍스트 자체의 상하 여백 제거 */
          }}
        >
          <Image
            src="/icon/TwoGetMore_3.png"
            alt="TwoGetMore 로고"
            width={70}
            height={70}
          />
          <span style={{ marginLeft: '1px', fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            TwoGetMore
          </span>
        </div>
      </header>

      {/* 2. 인증 섹션 */}
      <section className={styles.authSection}>
        <button onClick={() => router.push("/login")} className={styles.authCard}>
          <h2 className={styles.authTitle}>로그인 하기</h2>
          <p className={styles.authSub}>계정이 있으신가요?</p>
        </button>

        <button onClick={() => router.push("/register")} className={styles.authCard}>
          <h2 className={styles.authTitle}>계좌 개설하기 (회원가입)</h2>
          <p className={styles.authSub}>인증을 통해 모의 주식 투자를 경험하세요!</p>
        </button>
      </section>

      {/* 3. 실시간 차트 (로고 적용 완료) */}
      <section className={styles.stockSection}>
        <p className={styles.sectionTitle}>실시간 거래 대금 차트</p>
        <div className={styles.stockList}>
          {topStocks.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--text-tertiary)", fontSize: "0.9rem" }}>
              시세를 불러오는 중입니다...
            </p>
          ) : (
            topStocks.map((stock, idx) => {
              const isUp = (stock.changeRate || 0) > 0;
              const isDown = (stock.changeRate || 0) < 0;

              return (
                <div
                  key={idx}
                  className={styles.stockItem}
                  onClick={() => router.push(`/stock/${stock.stockCode}`)}
                >
                  {/* 💡 로고 이미지 영역 */}
                  <div className={styles.logoWrap}>
                    <Image
                      src={getLogo(stock.stockName)}
                      alt={stock.stockName || "로고"}
                      width={42}
                      height={42}
                      className={styles.logo}
                    />
                  </div>
                  <div className={styles.stockInfo}>
                    <p className={styles.stockName}>{stock.stockName}</p>
                    <p className={styles.stockQty}>{stock.stockCode}</p>
                  </div>
                  <div className={styles.stockValueInfo}>
                    <p className={styles.stockEval}>
                      {stock.currentPrice ? stock.currentPrice.toLocaleString() : "-"}원
                    </p>
                    <p className={isUp ? styles.itemProfitPlus : isDown ? styles.itemProfitMinus : styles.itemProfitNeutral}>
                      {stock.changeRate != null ? `${isUp ? "+" : ""}${stock.changeRate}%` : "0.00%"}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <button onClick={() => router.push("/stocks")} className={styles.moreBtn}>
            더보기
          </button>
        </div>
      </section>


      {/* 전역 하단 네비게이션 */}
      <BottomNav />
    </div>
  );
}