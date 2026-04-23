"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { useMyAssets } from "@/hooks/useMyAssets";
import { fetchApi } from "@/lib/client";
import styles from "./dashboard.module.css";
import BottomNav from "@/components/BottomNav"; // 추가

const getLogo = (name: string) => {
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


export default function DashboardPage() {
  useAuth();
  const router = useRouter();
  const { assets, isLoading } = useMyAssets();

  // 예수금 및 유저 정보 상태 추가
  const [deposit, setDeposit] = useState(0);
  const [nickname, setNickname] = useState("사용자");

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    // 계좌 정보(예수금 등) 조회
    fetchApi("/api/asset/accounts", {
      headers: { Authorization: `Bearer ${accessToken}` },
    }).then((res) => {
      // 서버 응답 구조에 따라 deposit 필드를 세팅합니다.
      setDeposit(res.data.deposit || 0);
      setNickname(res.data.nickname || "사용자");
    }).catch(console.error);

    // 유저 프로필 조회 로직 (필요 시 추가)
    //setNickname("진우");
  }, []);

  const totalSummary = useMemo(() => {
    const totalPurchase = assets.reduce((sum, s) => sum + s.averagePrice * s.quantity, 0);
    const totalEvaluation = assets.reduce((sum, s) => sum + s.currentPrice * s.quantity, 0);
    const totalProfit = totalEvaluation - totalPurchase;
    const profitRate = totalPurchase > 0 ? (totalProfit / totalPurchase) * 100 : 0;

    return { totalEvaluation, totalProfit, profitRate };
  }, [assets]);

  // 💡 로그아웃 로직
  const onLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    router.push("/");
  };

  if (isLoading) return <div className={styles.loading}>자산 정보를 불러오는 중...</div>;

  return (
    <div className={styles.container}>
      {/* 1. 상단 헤더 영역 */}
      <header className={styles.header}>
        <div className={styles.serviceName}>서비스 네임</div>
        <button onClick={onLogout} className={styles.logoutBtn}>
          로그아웃
        </button>
      </header>

      {/* 2. 유저 정보 및 배지 영역 */}
      <section className={styles.profileCard}>
        <span className={styles.nickname}>{nickname}</span>
        <div className={styles.badgeGroup}>
          <div className={styles.badgeDummy}>🏅</div>
          <div className={styles.badgeDummy}>🛡️</div>
        </div>
      </section>

      {/* 3. 예수금 영역 */}
      <section className={styles.depositCard}>
        <p className={styles.label}>원화</p>
        <h2 className={styles.amount}>{deposit.toLocaleString()} 원</h2>
      </section>

      {/* 4. 내 투자금(총 평가 자산) 요약 영역 */}
      <section className={styles.investmentSummary}>
        <p className={styles.label}>내 투자금</p>
        <h1 className={styles.totalValue}>{totalSummary.totalEvaluation.toLocaleString()} 원</h1>
        <p className={totalSummary.totalProfit >= 0 ? styles.profitPlus : styles.profitMinus}>
          {totalSummary.totalProfit.toLocaleString()}원 ({totalSummary.profitRate.toFixed(2)}% {totalSummary.totalProfit >= 0 ? "▲" : "▼"})
        </p>
      </section>

      {/* 5. 보유 주식 리스트 영역 */}
      <section className={styles.stockSection}>
        <p className={styles.sectionTitle}>보유주식</p>
        <div className={styles.stockList}>
          {assets.map((asset) => {
            const profit = (asset.currentPrice - asset.averagePrice) * asset.quantity;
            const rate = ((asset.currentPrice - asset.averagePrice) / asset.averagePrice) * 100;

            return (
              <div
                key={asset.stockCode}
                className={styles.stockItem}
                onClick={() => router.push(`/stock/${asset.stockCode}`)} // 💡 클릭 시 상세 페이지 이동 추가
              >
                <div className={styles.logoWrap}>
                  <Image
                    src={getLogo(asset.stockName)}
                    alt={asset.stockName}
                    width={42}
                    height={42}
                    className={styles.logo}
                  />
                </div>
                <div className={styles.stockInfo}>
                  <p className={styles.stockName}>{asset.stockName}</p>
                  <p className={styles.stockQty}>{asset.quantity.toLocaleString()} 주</p>
                </div>
                <div className={styles.stockValueInfo}>
                  <p className={styles.stockEval}>{(asset.currentPrice * asset.quantity).toLocaleString()}원</p>
                  <p className={profit >= 0 ? styles.itemProfitPlus : styles.itemProfitMinus}>
                    {profit.toLocaleString()}원({rate.toFixed(2)}%)
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. 하단 네비게이션 */}
      <BottomNav />
    </div>
  );
}