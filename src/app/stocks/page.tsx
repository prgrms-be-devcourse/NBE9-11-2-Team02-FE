"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

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
  if (name.includes("삼성")) return 58;
  if (name.includes("NAVER")) return 58;
  return 48;
};

type Stock = {
  id: number;
  stockCode: string;
  stockName: string;
  market: string;
  currentPrice: number | null;
  changeRate: number | null;
};

type HighlightMap = Record<number, "up" | "down" | null>;

export default function StocksPage() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [highlightMap, setHighlightMap] = useState<HighlightMap>({});
  const prevPriceMapRef = useRef<Record<number, number | null>>({});

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/stocks");
        const data: Stock[] = await res.json();

        const nextHighlightMap: HighlightMap = {};

        data.forEach((stock) => {
          const prevPrice = prevPriceMapRef.current[stock.id];
          const nextPrice = stock.currentPrice;

          if (
            prevPrice != null &&
            nextPrice != null &&
            prevPrice !== nextPrice
          ) {
            nextHighlightMap[stock.id] = nextPrice > prevPrice ? "up" : "down";
          } else {
            nextHighlightMap[stock.id] = null;
          }

          prevPriceMapRef.current[stock.id] = nextPrice;
        });

        setStocks(data);
        setHighlightMap(nextHighlightMap);

        setTimeout(() => {
          setHighlightMap({});
        }, 500);
      } catch (err) {
        console.error("주식 데이터 조회 실패", err);
      }
    };

    fetchStocks();
    const interval = setInterval(fetchStocks, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg-page)", // 아이보리 배경
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "560px",
          height: "900px",
          backgroundColor: "#ffffff",
          borderRadius: "36px",
          padding: "26px 22px 28px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
          overflow: "hidden",
        }}
      >
        <h1
          style={{
            fontSize: "54px",
            fontWeight: 700,
            color: "#111111",
            margin: "24px 0 20px",
            lineHeight: 1.15,
          }}
        >
          코스피 상장 종목
        </h1>

        <div
          style={{
            height: "2px",
            backgroundColor: "#d9d9d9",
            marginBottom: "14px",
          }}
        />

        <div
          style={{
            backgroundColor: "#0b0b0b", // 검은 리스트
            border: "1px solid #1f1f1f",
            borderRadius: "20px",
            flex: 1,
            overflowY: "auto",
            padding: "10px 0",
          }}
        >
          {stocks.map((stock) => {
            const isUp = (stock.changeRate ?? 0) > 0;
            const isDown = (stock.changeRate ?? 0) < 0;
            const highlight = highlightMap[stock.id];

            return (
              <div
                key={stock.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "88px minmax(0, 1fr) 170px",
                  alignItems: "center",
                  padding: "16px 18px",
                  transition: "background-color 0.3s ease",
                  borderBottom: "1px solid #1f1f1f",
                  backgroundColor:
                    highlight === "up"
                      ? "rgba(217, 79, 76, 0.15)"
                      : highlight === "down"
                      ? "rgba(68, 104, 196, 0.15)"
                      : "transparent",
                }}
              >
                <div
                  style={{
                    width: "62px",
                    height: "62px",
                    borderRadius: "50%",
                    backgroundColor: "#f5f5f5",
                    overflow: "hidden",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Image
                    src={getLogo(stock.stockName)}
                    alt={stock.stockName}
                    width={getLogoSize(stock.stockName)}
                    height={getLogoSize(stock.stockName)}
                    style={{ objectFit: "contain" }}
                  />
                </div>

                <div
                  style={{
                    color: "#ffffff",
                    fontSize: "26px",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    minWidth: 0,
                  }}
                >
                  {stock.stockName}
                </div>

                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: "26px",
                      fontWeight: 700,
                      color: isUp ? "#d94f4c" : isDown ? "#4468c4" : "#ffffff",
                      transition: "transform 0.25s ease",
                      transform: highlight ? "scale(1.08)" : "scale(1)",
                    }}
                  >
                    {stock.changeRate != null
                      ? `${stock.changeRate > 0 ? "+" : ""}${stock.changeRate}%`
                      : "-"}
                  </div>

                  <div
                    style={{
                      marginTop: "6px",
                      fontSize: "24px",
                      fontWeight: 500,
                      color: isUp ? "#d94f4c" : isDown ? "#4468c4" : "#dddddd",
                      transition: "transform 0.25s ease",
                      transform: highlight ? "scale(1.05)" : "scale(1)",
                    }}
                  >
                    {stock.currentPrice != null
                      ? `${stock.currentPrice.toLocaleString()}원`
                      : "-"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            marginTop: "20px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "14px",
          }}
        >
          <button
            style={{
              height: "90px",
              borderRadius: "28px",
              border: "2px solid #8060d4",
              backgroundColor: "#d8c9f3",
              color: "#111111",
              fontSize: "28px",
              fontWeight: 600,
              boxShadow: "0 4px 10px rgba(128, 96, 212, 0.18)",
              cursor: "pointer",
            }}
          >
            main
          </button>

          <button
            style={{
              height: "90px",
              borderRadius: "28px",
              border: "2px solid #8060d4",
              backgroundColor: "#d8c9f3",
              color: "#111111",
              fontSize: "28px",
              fontWeight: 600,
              boxShadow: "0 4px 10px rgba(128, 96, 212, 0.18)",
              cursor: "pointer",
            }}
          >
            전체종목
          </button>
        </div>
      </div>
    </div>
  );
}