"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./trade-sell.module.css";
/** * 숫자를 한국 원화 형식(₩)으로 포맷팅합니다. 
 * 예: 10000 -> "10,000원"
 */
function formatKrw(n: number): string {
  return `${n.toLocaleString("ko-KR")}원`;
}
/** * 입력된 수량 문자열을 천 단위 콤마가 포함된 문자열로 변환합니다. 
 */
function formatQtyDigits(raw: string): string {
  if (!raw) return "";
  return Number(raw).toLocaleString("ko-KR");
}

export default function TradeSellClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const SLIPPAGE_RATE = 0.98;
// URL 쿼리 파라미터에서 주식 정보를 가져오며, 없을 경우 기본값을 설정합니다.
  const stockCode = searchParams.get("stockCode") ?? "005930";
  const stockId = Number(searchParams.get("stockId") ?? "1");
  const stockName = searchParams.get("stockName") ?? "삼성전자";
// 상태 관리: 서버 데이터(실시간 가격) 및 UI 인터랙션(입력, 토스트, 로딩)
const [currentPrice, setCurrentPrice] = useState<number | null>(null);
const [changeSign, setChangeSign] = useState("");
const [changeRate, setChangeRate] = useState("");
const [qtyDigits, setQtyDigits] = useState("");
const [isBuying, setIsBuying] = useState(false);
const [toast, setToast] = useState<string | null>(null);

  // [추가] 나의 보유 주식 수량을 저장할 상태
  const [myMaxQty, setMyMaxQty] = useState(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const [isMarketOpen, setIsMarketOpen] = useState(true);

  /** [추가] 페이지 로드 시 나의 보유 주식 수량 조회 */
  useEffect(() => {
    // 실제 userId는 로그인 세션 등에서 가져오는 것이 좋습니다.
    fetch(`/api/asset/accounts/1`) 
      .then((res) => res.json())
      .then((res) => {
        // 서버 응답에서 해당 주식 코드를 찾아 보유 수량 저장
        const targetStock = res.data.stocks.find((s: any) => s.stockCode === stockCode);
        setMyMaxQty(targetStock ? targetStock.quantity : 0);
      })
      .catch(() => setMyMaxQty(0));
  }, [stockCode]);

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  // [추가] 보유 수량 초과 여부 계산
  const isExceeded = Number(qtyDigits) > myMaxQty;

  // [추가] 수수료 계산 로직
  const estimatedPrice = (currentPrice ?? 0) * SLIPPAGE_RATE;
  const totalAmount = Number(qtyDigits) * estimatedPrice;

  const isButtonDisabled = currentPrice === null || qtyDigits === "" || isBuying||isExceeded|| !isMarketOpen;

  const handleBuy = useCallback(async () => {
    if (isButtonDisabled) return;

    // 디바운싱: 마지막 클릭 후 300ms 내 재클릭 무시
    if (debounceTimer.current) return;
    debounceTimer.current = setTimeout(() => {
      debounceTimer.current = null;
    }, 300);

    setIsBuying(true);
    try {
      const res = await fetch("/api/trades/sell?userId=1", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify({ stockId, quantity: Number(qtyDigits), expectedPrice: currentPrice}),
      });

      if (!res.ok) {
        const err = await res.json();
        showToast(err.message ?? "매도에 실패했습니다.");
        return;
      }

      const result = await res.json();
      const { stockName: name, quantity, price } = result.data;
      showToast(
        `${name} ${quantity.toLocaleString("ko-KR")}주 매도 완료 (${price.toLocaleString("ko-KR")}원)`,
      );
      // [추가] 매도 성공 후 홈으로 이동 (경로가 '/'가 아니라면 해당 경로로 수정하세요)
      router.push('/');

      setQtyDigits("");
    } catch {
      showToast("네트워크 오류가 발생했습니다.");
    } finally {
      setIsBuying(false);
    }
  }, [isButtonDisabled, stockId, qtyDigits, showToast]);
/**
   * 실시간 주식 가격 구독 (EventSource / SSE)
   * 컴포넌트 마운트 시 서버와 연결하고, 언마운트 시 연결을 해제(cleanup)합니다.
   */
  useEffect(() => {
    const es = new EventSource(`http://localhost:8080/api/stocks/${stockCode}/sse`);

    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setCurrentPrice(Number(data.price));
      setChangeSign(data.changeSign);
      setChangeRate(data.changeRate);
    };

    es.onerror = () => es.close();

    return () => es.close();
  }, [stockCode]);

  // [추가] 장 운영 시간 체크 로직
  useEffect(() => {
    const checkMarketStatus = () => {
      const now = new Date();
      const day = now.getDay(); // 0:일, 1:월, ..., 6:토
      const hour = now.getHours();
      const minute = now.getMinutes();

      // 주말(토, 일)인 경우 장 마감
      if (day === 0 || day === 6) {
        setIsMarketOpen(false);
        return;
      }

      // 평일 09:00 ~ 15:30 확인
      if (hour < 9 || (hour === 15 && minute >= 30) || hour > 15) {
        setIsMarketOpen(false);
      } else {
        setIsMarketOpen(true);
      }
    };

    checkMarketStatus(); // 마운트 시 즉시 체크
    const timer = setInterval(checkMarketStatus, 60000); // 1분마다 체크

    return () => clearInterval(timer);
  }, []);

  const appendDigit = useCallback((d: string) => {
    setQtyDigits((prev) => {
      if (prev.length >= 7) return prev;
      if (prev === "0" && d !== "0") return d;
      if (prev === "0" && d === "0") return prev;
      return prev + d;
    });
  }, []);

  const appendDoubleZero = useCallback(() => {
    setQtyDigits((prev) => {
      if (prev.length >= 6) return prev;
      if (prev === "") return "";
      return prev + "00";
    });
  }, []);

  const backspace = useCallback(() => {
    setQtyDigits((prev) => prev.slice(0, -1));
  }, []);

  const keys = useMemo(
    () => [
      ["1", "2", "3"],
      ["4", "5", "6"],
      ["7", "8", "9"],
      ["00", "0", "back"],
    ],
    [],
  );

  // [추가] 물리 키보드 입력 처리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 숫자 키 (0-9) 처리
      if (e.key >= "0" && e.key <= "9") {
        appendDigit(e.key);
      }
      // 백스페이스 처리
      else if (e.key === "Backspace") {
        backspace();
      }
      // Enter 키 처리 (판매하기 버튼 실행)
      else if (e.key === "Enter") {
        if (!isButtonDisabled) {
          handleBuy();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // 컴포넌트 언마운트 시 이벤트 리스너 제거 (중요!)
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [appendDigit, backspace, handleBuy, isButtonDisabled]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.topBar}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => router.back()}
            aria-label="뒤로 가기"
          >
            <span className={styles.backIcon} aria-hidden>
              ←
            </span>
          </button>
          <div className={styles.headerCenter}>
            <p className={styles.stockName}>{stockName}</p>
            <p className={styles.priceRow}>
              {currentPrice !== null ? formatKrw(currentPrice) : "-"}
              {changeRate && (
                <span className={styles.change}>
                  {["4", "5"].includes(changeSign) ? "-" : "+"}
                  {changeRate}%
                </span>
              )}
            </p>
          </div>
          <div className={styles.topBarSpacer} aria-hidden />
        </div>
        {/* [추가] 장 마감 알림 표시 */}
        {!isMarketOpen && (
          <div className={styles.marketClosedAlert}>
            현재는 장 운영 시간이 아닙니다 (09:00~15:30)
          </div>
        )}
      </header>

      <div className={styles.body}>
        <section className={styles.card} aria-label="판매 가격">
          <p className={styles.priceLabel}>판매할 가격(시장가)</p>
          <p className={styles.priceValue}>
            {currentPrice !== null ? formatKrw(currentPrice) : "-"}
          </p>
        </section>

        <section className={styles.card} aria-label="수량 입력">
          <div className={styles.qtyPrompt}>
            {qtyDigits ? (
              <span>{formatQtyDigits(qtyDigits)}주</span>
            ) : (
              <>
                <span className={styles.cursor} aria-hidden />
                <span className={styles.qtyPlaceholder}>몇 주 판매할까요?</span>
              </>
            )}
          </div>
          {/* [추가] 보유 수량 정보 및 경고 메시지 */}
        <p className={isExceeded || !isMarketOpen ? styles.errorInfo : styles.subInfo} 
           style={{ color: (isExceeded || !isMarketOpen) ? 'red' : 'inherit' }}>
          {isExceeded 
            ? `보유 수량을 초과했습니다 (보유: ${myMaxQty}주)` 
            : !isMarketOpen 
            ? "장 마감 시간으로 매도가 불가능합니다."
            : `보유: ${myMaxQty.toLocaleString()}주 · ${qtyDigits && currentPrice !== null ? `총 ${formatKrw(Number(qtyDigits) * currentPrice)}` : "판매가능"}`
          }
        </p>
        {/* [수정] "최소" 문구 적용 */}
        {qtyDigits && currentPrice !== null && (
          <div style={{ marginTop: '8px', fontSize: '0.85rem', color: '#666', padding: '8px', borderRadius: '4px', background: '#f9f9f9' }}>
            <p>최소 {formatKrw(totalAmount)}</p>
          </div>
        )}
        </section>
        <p style={{ fontWeight: 'bold', color: '#d32f2f' }}>
              ⚠️ 시장 상황에 따라 최대 2% 차이가 발생할 수 있습니다.
            </p>
        <div className={styles.keypadWrap}>
          <div className={styles.keypad} role="group" aria-label="숫자 키패드">
            {keys.map((row, ri) =>
              row.map((key) => (
                <button
                  key={`${ri}-${key}`}
                  type="button"
                  className={styles.key}
                  onClick={() => {
                    if (key === "back") backspace();
                    else if (key === "00") appendDoubleZero();
                    else appendDigit(key);
                  }}
                >
                  {key === "back" ? (
                    <span className={styles.keyIcon} aria-label="지우기">
                      ⌫
                    </span>
                  ) : (
                    key
                  )}
                </button>
              )),
            )}
          </div>
        </div>
      </div>

      {toast && <div className={styles.toast}>{toast}</div>}

      <footer className={styles.footer}>
        <button
          type="button"
          className={styles.buyBtn}
          onClick={handleBuy}
          disabled={isButtonDisabled}
        >
          {isBuying ? "처리 중..." : !isMarketOpen ? "장 마감" : isExceeded ? "수량 초과" : "판매하기"}
        </button>
      </footer>
    </div>
  );
}
