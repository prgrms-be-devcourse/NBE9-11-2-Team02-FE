"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/client";
// CSS Module import
import styles from "./guest-dashboard.module.css"; 

type Stock = {
  stockName: string;
  stockCode: string;
  currentPrice: number;
};

export function GuestDashboard() {
  const router = useRouter();
  const [topStocks, setTopStocks] = useState<Stock[]>([]);

  useEffect(() => {
    const fetchTopStocks = async () => {
      try {
        const res = await fetchApi("/api/stocks");
        setTopStocks(Array.isArray(res) ? res.slice(0, 3) : []);
      } catch (e) {
        console.error(e);
      }
    };
    fetchTopStocks();
  }, []);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.title}>Together</p>
        <p className={styles.subtitle}>모의 주식 투자 서비스를 시작해보세요</p>
      </header>

      <div className={styles.body}>
        <section className={styles.card}>
          <p className={styles.sectionTitle}>계정 시작</p>
          <div className={styles.authButtons}>
            <button onClick={() => router.push("/login")} className={styles.primaryButton}>
              로그인
            </button>
            <button onClick={() => router.push("/register")} className={styles.secondaryButton}>
              회원가입
            </button>
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.listHeader}>
            <p className={styles.sectionTitle}>실시간 인기 종목</p>
            <button className={styles.moreButton} onClick={() => router.push("/stocks")}>
              전체보기
            </button>
          </div>
          <div className={styles.stockList}>
            {topStocks.map((stock) => (
              <div key={stock.stockCode} className={styles.stockItem}>
                <div className={styles.stockInfo}>
                  <p className={styles.stockName}>{stock.stockName}</p>
                  <p className={styles.stockCode}>{stock.stockCode}</p>
                </div>
                <p className={styles.stockPrice}>{stock.currentPrice.toLocaleString()}원</p>
              </div>
            ))}
            {topStocks.length === 0 && <p className={styles.emptyText}>표시할 종목이 없습니다.</p>}
          </div>
        </section>
      </div>

      <footer className={styles.footer}>
        <button className={styles.footerButton} onClick={() => router.push("/stocks")}>
          전체 종목 보기
        </button>
      </footer>
    </div>
  );
}

export default GuestDashboard;