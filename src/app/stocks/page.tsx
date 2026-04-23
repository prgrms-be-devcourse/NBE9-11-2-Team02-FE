"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./stocks.module.css";

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

const getLogoSize = (name: string) => {
  if (name.includes("삼성")) return 48;
  if (name.includes("NAVER")) return 48;
  return 42;
};

type Stock = {
  id: number;
  stockCode: string;
  stockName: string;
  currentPrice: number | null;
  changeRate: number | null;
};

type HighlightMap = Record<number, "up" | "down" | null>;

export default function StocksPage() {
  const router = useRouter();

  const [stocks, setStocks] = useState<Stock[]>([]);
  const [highlightMap, setHighlightMap] = useState<HighlightMap>({});
  const [error, setError] = useState("");
  const prevPriceMapRef = useRef<Record<number, number | null>>({});
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const eventSource = new EventSource("http://localhost:8080/api/stocks/sse");

    eventSource.onmessage = (event) => {
      try {
        const data: Stock[] = JSON.parse(event.data);
        const nextHighlightMap: HighlightMap = {};

        data.forEach((stock) => {
          const prevPrice = prevPriceMapRef.current[stock.id];
          const nextPrice = stock.currentPrice;

          if (prevPrice != null && nextPrice != null && prevPrice !== nextPrice) {
            nextHighlightMap[stock.id] = nextPrice > prevPrice ? "up" : "down";
          } else {
            nextHighlightMap[stock.id] = null;
          }

          prevPriceMapRef.current[stock.id] = nextPrice;
        });

        setStocks(data);
        setHighlightMap(nextHighlightMap);
        setError("");

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setHighlightMap({}), 500);
      } catch (e) {
        console.error("SSE 데이터 파싱 실패", e);
        setError("실시간 종목 데이터를 처리하지 못했습니다.");
      }
    };

    eventSource.onerror = () => {
      setError("실시간 종목 데이터를 불러오지 못했습니다.");
      eventSource.close();
    };

    return () => {
      eventSource.close();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleMainClick = () => {
    const accessToken = localStorage.getItem("accessToken");

    if (accessToken) {
      router.push("/dashboard");
    } else {
      router.push("/");
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>코스피 상장 종목</h1>
      </header>

      <main className={styles.list}>
        {error ? (
          <div className={styles.messageError}>{error}</div>
        ) : stocks.length === 0 ? (
          <div className={styles.messageLoading}>종목 데이터를 불러오는 중입니다.</div>
        ) : (
          stocks.map((stock) => {
            const isUp = (stock.changeRate ?? 0) > 0;
            const isDown = (stock.changeRate ?? 0) < 0;
            const highlight = highlightMap[stock.id];

            return (
              <Link
                key={stock.id}
                href={`/stock/${stock.stockCode}`}
                className={`${styles.rowLink} ${
                  highlight === "up"
                    ? styles.rowUp
                    : highlight === "down"
                    ? styles.rowDown
                    : ""
                }`}
              >
                <div className={styles.row}>
                  <div className={styles.logoWrap}>
                    <Image
                      src={getLogo(stock.stockName)}
                      alt={stock.stockName}
                      width={getLogoSize(stock.stockName)}
                      height={getLogoSize(stock.stockName)}
                      className={styles.logo}
                    />
                  </div>

                  <div className={styles.nameArea}>
                    <div className={styles.stockName}>{stock.stockName}</div>
                  </div>

                  <div className={styles.priceArea}>
                    <div
                      className={`${styles.changeRate} ${
                        isUp
                          ? styles.priceUp
                          : isDown
                          ? styles.priceDown
                          : styles.priceNeutral
                      } ${highlight ? styles.scaleUp : ""}`}
                    >
                      {stock.changeRate != null
                        ? `${stock.changeRate > 0 ? "+" : ""}${stock.changeRate}%`
                        : "-"}
                    </div>

                    <div
                      className={`${styles.currentPrice} ${
                        highlight ? styles.scaleSoft : ""
                      }`}
                    >
                      {stock.currentPrice != null
                        ? `${stock.currentPrice.toLocaleString()}원`
                        : "-"}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </main>

      <nav className={styles.bottomNav}>
        <button
          type="button"
          className={styles.navItem}
          onClick={handleMainClick}
        >
          main
        </button>

        <Link href="/stocks" className={`${styles.navItem} ${styles.navActive}`}>
          전체종목
        </Link>

        <Link href="/ranking" className={styles.navItem}>
          랭킹
        </Link>
      </nav>
    </div>
  );
}