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
  if (name.includes("삼성")) return 300;
  if (name.includes("NAVER")) return 300;
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
        backgroundColor: "#dcdcdc",
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
          backgroundColor: "#e9e9e9",
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
            color: "#111",
            margin: "24px 0 20px",
            lineHeight: 1.15,
          }}
        >
          코스피 상장 종목
        </h1>

        <div
          style={{
            height: "2px",
            backgroundColor: "#c9c9c9",
            marginBottom: "14px",
          }}
        />

        <div
          style={{
            backgroundColor: "#101018",
            border: "3px solid #1a1a1a",
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
                  backgroundColor:
                    highlight === "up"
                      ? "rgba(255, 80, 80, 0.12)"
                      : highlight === "down"
                      ? "rgba(70, 130, 255, 0.12)"
                      : "transparent",
                }}
              >
                <div
                  style={{
                    width: "62px",
                    height: "62px",
                    borderRadius: "50%",
                    backgroundColor: "#f8f8f8",
                    overflow: "hidden",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center"
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
                    color: "#d9d9d9",
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
                      color: isUp ? "#ff4d6d" : isDown ? "#3b82f6" : "#ffffff",
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
                      color: isUp ? "#ff4d6d" : isDown ? "#3b82f6" : "#d9d9d9",
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
              height: "92px",
              borderRadius: "28px",
              border: "4px solid #9b8cf2",
              backgroundColor: "#d8d2f3",
              fontSize: "32px",
              fontWeight: 500,
              color: "#111",
              cursor: "pointer",
            }}
          >
            main
          </button>

          <button
            style={{
              height: "92px",
              borderRadius: "28px",
              border: "4px solid #9b8cf2",
              backgroundColor: "#d8d2f3",
              fontSize: "32px",
              fontWeight: 500,
              color: "#111",
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