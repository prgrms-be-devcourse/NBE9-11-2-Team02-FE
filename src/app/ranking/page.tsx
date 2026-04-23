"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./ranking.module.css";

type RankingItem = {
  userId: number;
  nickname: string;
  rank: number;
  profitRate: number;
  totalAsset: number;
};

function formatMoney(value: number) {
  return `${Number(value).toLocaleString("ko-KR")}원`;
}

function formatRate(value: number) {
  const num = Number(value);
  const sign = num > 0 ? "+" : "";
  return `${sign}${num.toFixed(2)}%`;
}

function getBadgeLabel(rank: number) {
  switch (rank) {
    case 1:
      return "1ST";
    case 2:
      return "2ND";
    case 3:
      return "3RD";
    case 4:
      return "4TH";
    case 5:
      return "5TH";
    default:
      return `${rank}`;
  }
}

function getBadgeClass(rank: number) {
  switch (rank) {
    case 1:
      return styles.badgeFirst;
    case 2:
      return styles.badgeSecond;
    case 3:
      return styles.badgeThird;
    case 4:
      return styles.badgeFourth;
    case 5:
      return styles.badgeFifth;
    default:
      return styles.badgeDefault;
  }
}

export default function RankingPage() {
  const router = useRouter();
  const redirectHandledRef = useRef(false);

  const [rankings, setRankings] = useState<RankingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (redirectHandledRef.current) return;

    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
      redirectHandledRef.current = true;
      alert("로그인이 필요합니다.");
      router.push("/login");
      return;
    }

    const fetchRankings = async () => {
      try {
        setIsLoading(true);
        setError("");

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/rankings`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!res.ok) {
          const data = await res.json().catch(() => null);

          if (res.status === 401 || res.status === 403) {
            if (!redirectHandledRef.current) {
              redirectHandledRef.current = true;
              alert("로그인이 필요합니다.");
              router.push("/login");
            }
            return;
          }

          throw new Error(data?.message ?? "랭킹 조회에 실패했습니다.");
        }

        const data: RankingItem[] = await res.json();
        setRankings(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "랭킹 조회에 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRankings();
  }, [router]);

  const content = useMemo(() => {
    if (isLoading) {
      return <div className={styles.stateBox}>랭킹을 불러오는 중입니다.</div>;
    }

    if (error) {
      return <div className={styles.stateBox}>{error}</div>;
    }

    if (rankings.length === 0) {
      return <div className={styles.stateBox}>아직 랭킹 데이터가 없습니다.</div>;
    }

    return rankings.map((item) => (
      <div key={item.userId} className={styles.rankCard}>
        <div className={styles.rankNumber}>{item.rank}</div>

        <div className={`${styles.badge} ${getBadgeClass(item.rank)}`}>
          <span className={styles.badgeText}>{getBadgeLabel(item.rank)}</span>
        </div>

        <div className={styles.userInfo}>
          <div className={styles.nickname}>{item.nickname}</div>
        </div>

        <div className={styles.valueBox}>
          <div className={styles.profitRate}>{formatRate(item.profitRate)}</div>
          <div className={styles.totalAsset}>{formatMoney(item.totalAsset)}</div>
        </div>
      </div>
    ));
  }, [isLoading, error, rankings]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleBox}>Together 랭킹</div>
        <div className={styles.updateBox}>랭킹 갱신 시각: 매일 00:00</div>

        <button
          type="button"
          className={styles.infoButton}
          onClick={() => setIsModalOpen(true)}
          aria-label="랭킹 안내 열기"
        >
          ?
        </button>
      </header>

      <main className={styles.listSection}>{content}</main>

      <nav className={styles.bottomNav}>
        <button
          type="button"
          className={styles.navButton}
          onClick={() => router.push("/dashboard")}
        >
          main
        </button>
        <button
          type="button"
          className={styles.navButton}
          onClick={() => router.push("/stocks")}
        >
          전체종목
        </button>
        <button
          type="button"
          className={`${styles.navButton} ${styles.navButtonActive}`}
          onClick={() => router.push("/ranking")}
        >
          랭킹
        </button>
      </nav>

      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.modalClose}
              onClick={() => setIsModalOpen(false)}
              aria-label="닫기"
            >
              ×
            </button>

            <h2 className={styles.modalTitle}>등수 기준</h2>
            <ul className={styles.modalList}>
              <li>수익률 기준으로 순위가 계산됩니다.</li>
              <li>일간 랭킹은 매일 00시에 갱신됩니다.</li>
              <li>월간 랭킹은 매달 말일에 확정됩니다.</li>
              <li>매월 1일 랭킹이 초기화됩니다.</li>
            </ul>

            <h2 className={styles.modalTitle}>보상 안내</h2>
            <ul className={styles.modalList}>
              <li>1~5등은 순위에 따라 다른 배지 스타일로 표시됩니다.</li>
              <li>월간 확정 랭킹은 이후 보상 기준으로 사용됩니다.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}