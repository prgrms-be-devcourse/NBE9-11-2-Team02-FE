import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/client"; // 💡 REST 통신을 위해 추가

export interface UserStockAsset {
  stockName: string;
  stockCode: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
}

export function useMyAssets() {
  const [assets, setAssets] = useState<UserStockAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let es: EventSource | null = null;
    let isMounted = true;

    const initializeDataAndSSE = async () => {
      try {
        // 1. 로컬 스토리지에서 토큰 꺼내기
        const accessToken = localStorage.getItem("accessToken");

        // 2. REST API 호출 시 Authorization 헤더 추가 💡 (이 부분이 수정됨)
        const res = await fetchApi("/api/asset/stocks", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (isMounted) {
          setAssets(res.data);
          setIsLoading(false); // 💡 데이터를 받자마자 화면을 그려줌
        }

        // 💡 성능 최적화: 보유 주식이 없으면 SSE 연결을 시도조차 하지 않음
        if (res.data.length === 0) return;

        // 2. 초기 데이터를 다 불러온 후에만 SSE 실시간 스트림 연결
        const sseUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/asset/stocks/sse${
          accessToken ? `?token=${accessToken}` : ""
        }`;
        
        es = new EventSource(sseUrl);

        // INITIAL_STOCKS_DATA 이벤트 리스너는 삭제됨 (REST API가 대체)

        // 3. 실시간 가격 업데이트 로직
        es.addEventListener("priceUpdate", (e: any) => {
          const updatedPriceData = JSON.parse(e.data);
          setAssets((prevAssets) =>
            prevAssets.map((asset) =>
              asset.stockCode === updatedPriceData.stockCode
                ? { ...asset, currentPrice: Number(updatedPriceData.price) }
                : asset
            )
          );
        });

        es.onerror = () => {
          console.error("SSE connection error");
          es?.close();
        };

      } catch (error) {
        console.error("자산 정보를 불러오는 데 실패했습니다.", error);
        if (isMounted) setIsLoading(false);
      }
    };

    initializeDataAndSSE();

    // 클린업 함수: 화면을 벗어나면 SSE 연결 종료
    return () => {
      isMounted = false;
      if (es) es.close();
    };
  }, []);

  return { assets, isLoading };
}