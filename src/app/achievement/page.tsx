"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { fetchApi } from "@/lib/client";
import BottomNav from "@/components/BottomNav";
import AchievementCard from "@/components/AchievementCard";
import { Achievement } from "@/type/achievement";
import styles from "@/app/dashboard/dashboard.module.css"; // 대시보드와 동일한 스타일 모듈 사용 (또는 achievement.module.css)

// API 응답에서 배열을 추출하는 헬퍼 함수
function extractAchievements(payload: any): Achievement[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.result)) return payload.result;
  if (Array.isArray(payload?.data?.content)) return payload.data.content;
  return [];
}

export default function AchievementPage() {
  useAuth(); // 인증 체크 훅
  const router = useRouter();
  
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    
    // 대시보드와 동일한 fetchApi 클라이언트 사용
    fetchApi("/api/achievements/me", {
      headers: { ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
    })
      .then((res) => {
        const list = extractAchievements(res);
        setAchievements(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        console.error("업적 조회 실패:", err);
        setAchievements([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // 업적 달성 요약 정보 계산
  const summary = useMemo(() => {
    const totalCount = achievements.length;
    const achievedCount = achievements.filter((a) => a.isAchieved).length;
    const progressRate = totalCount > 0 ? (achievedCount / totalCount) * 100 : 0;
    
    return { totalCount, achievedCount, progressRate };
  }, [achievements]);

  // 대시보드와 동일한 로그아웃 로직
  const onLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    router.push("/");
  };

  if (isLoading) return <div className={styles.loading}>업적 정보를 불러오는 중...</div>;

  return (
    <div className={styles.container}>
      {/* 1. 상단 헤더 영역 (대시보드와 동일) */}
      <header className={styles.header}>
        <div className={styles.serviceName}>업적</div>
        <button onClick={onLogout} className={styles.logoutBtn}>
          로그아웃
        </button>
      </header>

      {/* 2. 내 업적 요약 영역 (투자금 요약 영역 스타일 차용) */}
      <section className={styles.investmentSummary}>
        <p className={styles.label}>전체 달성률</p>
        <h1 className={styles.totalValue}>{summary.progressRate.toFixed(1)}%</h1>
        <p className={summary.achievedCount > 0 ? styles.profitPlus : styles.label}>
          총 {summary.totalCount}개 중 {summary.achievedCount}개 달성
        </p>
        {/* 프로그레스 바 (인라인 스타일 또는 별도 클래스로 처리 가능) */}
        <div style={{ marginTop: '12px', width: '100%', backgroundColor: '#eee', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${summary.progressRate}%`, backgroundColor: '#3b82f6', height: '100%', transition: 'width 0.5s ease-in-out' }} />
        </div>
      </section>

      {/* 3. 업적 리스트 영역 (보유주식 리스트 영역 스타일 차용) */}
      <section className={styles.stockSection}>
        <p className={styles.sectionTitle}>도전 과제</p>
        <div className={styles.stockList}>
          {achievements.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
              표시할 업적이 없습니다.
            </div>
          ) : (
            achievements.map((item) => (
              // AchievementCard를 사용하거나, Dashboard의 stockItem 디자인을 이식할 수 있습니다.
              <AchievementCard key={item.code} achievement={item} />
            ))
          )}
        </div>
      </section>

      {/* 4. 하단 네비게이션 (대시보드와 동일) */}
      <BottomNav />
    </div>
  );
}