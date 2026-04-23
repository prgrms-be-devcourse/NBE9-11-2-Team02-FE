"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { useMyAssets } from "@/hooks/useMyAssets";
import { fetchApi } from "@/lib/client";
import styles from "./dashboard.module.css";
import BottomNav from "@/components/BottomNav"; // 추가
import { Achievement } from "@/type/achievement";

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

  // 💡 1. 달성한 업적 목록을 담을 상태 추가
  const [achievedBadges, setAchievedBadges] = useState<Achievement[]>([]);

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

    // 💡 2. 업적 정보 조회 API 호출 추가
    fetchApi("/api/achievements/me", { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((res) => {
        const data = res.data || res.result || res;
        const list = Array.isArray(data) ? data : [];
        // isAchieved가 true인(달성 완료된) 업적만 필터링해서 상태에 저장
        setAchievedBadges(list.filter((a: Achievement) => a.isAchieved));
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
        <div
          className={styles.serviceName}
          style={{
            background: 'transparent',
            border: 'none',
            boxShadow: 'none',
            padding: 0,
            display: 'flex',      /* 💡 필수: 가로 정렬 */
            alignItems: 'center', /* 💡 필수: 로고와 텍스트의 세로 중앙을 맞춤 */
            height: '30px',       /* 💡 로고 높이와 맞춰서 영역 확보 */
            lineHeight: '1'       /* 💡 텍스트 자체의 상하 여백 제거 */
          }}
        >
          <Image
            src="/icon/TwoGetMore_3.png"
            alt="TwoGetMore 로고"
            width={70}  /* 💡 기존 40에서 70으로 크기 확대 (원하시는 수치로 조절 가능) */
            height={70} /* 💡 width와 동일한 비율로 확대 */
          />
          <span style={{ marginLeft: '1px', fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            TwoGetMore
          </span>
        </div>
        <button onClick={onLogout} className={styles.logoutBtn}>
          로그아웃
        </button>
      </header>

      {/* 💡 2. 유저 정보 및 배지 영역 렌더링 수정 */}
      <section className={styles.profileCard}>
        <span className={styles.nickname}>{nickname}</span>

        {/* 💡 클릭 시 업적 페이지로 이동하도록 onClick 이벤트와 포인터 커서 추가 */}
        <div
          className={styles.badgeGroup}
          onClick={() => router.push("/achievement")}
          style={{ cursor: "pointer" }}
          title="내 업적 보러가기"
        >
          {achievedBadges.length === 0 ? (
            // 달성한 업적이 없을 때 보여줄 기본 텍스트나 디자인
            <span style={{ fontSize: '12px', color: '#888' }}>새싹 투자자 🌱</span>
          ) : (
            <>
              {/* 최대 3개까지만 아이콘으로 보여줌 */}
              {achievedBadges.slice(0, 3).map((badge, idx) => (
                <div
                  key={badge.code || idx}
                  className={styles.badgeDummy}
                  title={badge.name} // 마우스를 올리면 업적 이름이 보이도록 title 속성 추가
                >
                  🏆 {/* DB에 이모지가 있다면 badge.icon 등을 활용할 수 있습니다 */}
                </div>
              ))}
              {/* 달성한 업적이 3개를 초과하면 나머지 개수를 숫자로 표시 */}
              {achievedBadges.length > 3 && (
                <span style={{ fontSize: '12px', color: '#666', marginLeft: '4px', fontWeight: 'bold' }}>
                  +{achievedBadges.length - 3}
                </span>
              )}
            </>
          )}
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