"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
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
  useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
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

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    fetch(`/api/asset/accounts`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => res.json())
      .then((res) => {
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

  const isButtonDisabled = currentPrice === null || qtyDigits === "" || isBuying||isExceeded;

  const handleBuy = useCallback(async () => {
    if (isButtonDisabled) return;

    // 디바운싱: 마지막 클릭 후 300ms 내 재클릭 무시
    if (debounceTimer.current) return;
    debounceTimer.current = setTimeout(() => {
      debounceTimer.current = null;
    }, 300);

    setIsBuying(true);
    try {
      const accessToken = localStorage.getItem("accessToken");
      const res = await fetch("/api/trades/sell", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Idempotency-Key": crypto.randomUUID(),
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ stockId, quantity: Number(qtyDigits) }),
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
          {/* [추가] 보유 수량 정보 및 초과 시 경고 메시지 */}
          <p className={isExceeded ? styles.errorInfo : styles.subInfo} style={{ color: isExceeded ? 'red' : 'inherit' }}>
            {isExceeded 
              ? `보유 수량을 초과했습니다 (보유: ${myMaxQty}주)` 
              : `보유: ${myMaxQty.toLocaleString()}주 · ${qtyDigits && currentPrice !== null ? `총 ${formatKrw(Number(qtyDigits) * currentPrice)}` : "판매가능"}`
            }
          </p>
        </section>

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
          {isBuying ? "처리 중..." : isExceeded ? "수량 초과" : "판매하기"}
        </button>
      </footer>
    </div>
  );
}
