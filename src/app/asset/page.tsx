"use client";

import { useEffect, useState } from "react";
import styles from "./asset.module.css";
import { fetchApi } from "@/lib/client";
import { useSearchParams } from "next/navigation";

type ApiResponse<T> = {
  message: string;
  data: T;
};

type Stock = {
  stockCode: string;
  quantity: number;
};

type AssetResponse = {
  totalAmount: number;
  stocks: Stock[];
};

export default function MainPage() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");

  const [totalAmount, setTotalAmount] = useState(0);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [prices, setPrices] = useState<Record<string, number>>({});

  /** 계좌 정보 */
  useEffect(() => {
    if (!userId) return;

    fetchApi(`/api/asset/accounts/${userId}`)
      .then((res: ApiResponse<AssetResponse>) => {
        setTotalAmount(res.data.totalAmount);
        setStocks(res.data.stocks);
      })
      .catch(console.error);
  }, [userId]);

  console.log("totalAmount:", totalAmount);
  console.log("stocks:", stocks);
  console.log("prices:", prices);

  /** 현재가 polling */
  useEffect(() => {
    if (stocks.length === 0) return;

    const fetchPrices = async () => {
      const newPrices: Record<string, number> = {};

      for (const stock of stocks) {
        try {
          const res = await fetchApi(`/api/stocks/${stock.stockCode}`);
          newPrices[stock.stockCode] = res.data.price;
        } catch (e) {
          console.error("현재가 조회 실패", stock.stockCode);
        }
      }

      setPrices(newPrices);
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 1000);
    return () => clearInterval(interval);
  }, [stocks]);

  /** 총 자산 */
  const totalValue = stocks.reduce((sum, stock) => {
    const price = prices[stock.stockCode] || 0;
    return sum + price * stock.quantity;
  }, 0);

  /** 수익률 */
  const changeRate =
    totalAmount === 0 ? 0 : ((totalValue - totalAmount) / totalAmount) * 100;

  const isUp = changeRate >= 0;


  return (
    <div className={styles.page}>
      {/* 상단 */}
      <div className={styles.top}>
        <div className={styles.search}>🔍</div>

        <div className={styles.asset}>
          <div className={styles.total}>
            {totalValue.toLocaleString()}원
          </div>

          <div
            className={`${styles.change} ${
              isUp ? styles.up : styles.down
            }`}
          >
            {isUp ? "▲" : "▼"} {changeRate.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* 하단 (비워둠) */}
      <div className={styles.bottom}></div>
    </div>
  );
}