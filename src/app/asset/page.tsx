"use client";

import { useEffect, useState } from "react";
import styles from "./asset.module.css";
import { fetchApi } from "@/lib/client";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

/** 보유 주식 */
type StockInfo = {
  stockCode: string; //"005930"
  stockName: string; //삼성전자
  quantity: number; //보유수량(10)
};

/** 자산 응답 */
type AssetRes = {
  totalAmount: number; //총 매수금
  stocks: StockInfo[]; //보유 주식 정보 리스트
};

export default function MainPage() {
  useAuth();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");

  const [totalAmount, setTotalAmount] = useState(0);
  const [stocks, setStocks] = useState<StockInfo[]>([]);
  const [prices, setPrices] = useState<Record<string, number>>({});

  /** 1️⃣ 자산 + 보유 주식 조회 */
useEffect(() => {
  if (!userId) return;

  fetchApi(`/api/asset/accounts/${userId}`)
    .then((res) => {
      const data: AssetRes = res.data;

      setTotalAmount(data.totalAmount);
      setStocks(data.stocks || []); 
    })
    .catch(console.error);
}, [userId]);

  /** 2️⃣ 가격 폴링 (수정된 버전) */
  useEffect(() => {
    // stocks가 없어도 실행은 되어야 최신가를 받아오므로 조건 제거 또는 수정
    // stocks.length === 0 조건은 필요시 유지하세요

    const fetchPrices = async () => {
      try {
        // 1. API 응답 자체가 배열이므로 바로 allStocks로 받습니다.
        const allStocks = await fetchApi(`/api/stocks`);

        // 2. allStocks가 배열인지 확인 후 데이터 매핑
        if (Array.isArray(allStocks)) {
          const newPrices: Record<string, number> = {};
          
          allStocks.forEach((stock: any) => {
            newPrices[stock.stockCode] = stock.currentPrice;
          });
          
          setPrices(newPrices);
        }
      } catch (e) {
        console.error("가격 조회 실패:", e);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 1000);

    return () => clearInterval(interval);
  }, []);

  /** 3️⃣ 보유 주식 가치 */
  const totalStockValue = stocks.reduce((sum, stock) => {
    const price = prices[stock.stockCode] || 0;
    return sum + price * stock.quantity;
  }, 0);

  /** 4️⃣ 총 자산 */
  //const totalValue = totalAmount + totalStockValue;
  const totalValue = totalStockValue;

  /** 5️⃣ 수익률 */
  //const profitLoss = totalStockValue;
  const profitLoss = totalStockValue - totalAmount;
  const changeRate =
    totalAmount === 0 ? 0 : (profitLoss / totalAmount) * 100;
  const isUp = changeRate >= 0;

  return (
    <div className={styles.page}>
      <div className={styles.top}>
        <div className={styles.search}>🔍</div>

        <div className={styles.asset}>
          <div className={styles.total}>
            {totalValue.toLocaleString()}원
          </div>

          <div className={`${styles.change} ${isUp ? styles.up : styles.down}`}>
            {(totalStockValue-totalAmount).toLocaleString()}{"원 "}{isUp ? "▲" : "▼"} {Math.abs(changeRate).toFixed(2)}%
          </div>
        </div>
      </div>

      <div className={styles.bottom}>
        {stocks.map((stock) => {
          const price = prices[stock.stockCode] || 0;

          return (
            <div key={stock.stockCode} className={styles.stockItem}>
              <span>{stock.stockName}</span>
              <span>
                {price.toLocaleString()}원 × {stock.quantity}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}