"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./trade-buy.module.css";
import { useAuth } from "@/hooks/useAuth";

function formatKrw(n: number): string {
  return `${n.toLocaleString("ko-KR")}원`;
}

function formatQtyDigits(raw: string): string {
  if (!raw) return "";
  return Number(raw).toLocaleString("ko-KR");
}

export default function TradeBuyClient() {
  useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const stockCode = searchParams.get("stockCode") ?? "005930";
  const stockId = Number(searchParams.get("stockId") ?? "1");
  const stockName = searchParams.get("stockName") ?? "삼성전자";

  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [changeSign, setChangeSign] = useState("");
  const [changeRate, setChangeRate] = useState("");
  const [qtyDigits, setQtyDigits] = useState("");
  const [isBuying, setIsBuying] = useState(false);
  const [showPriceInfo, setShowPriceInfo] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const isButtonDisabled = currentPrice === null || qtyDigits === "" || isBuying;

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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/trades/buy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Idempotency-Key": crypto.randomUUID(),
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ stockId, quantity: Number(qtyDigits), expectedPrice: currentPrice }),
      });

      if (!res.ok) {
        const err = await res.json();
        showToast(err.message ?? "매수에 실패했습니다.");
        return;
      }

      const result = await res.json();
      const { stockName: name, quantity, price } = result.data;
      showToast(
        `${name} ${quantity.toLocaleString("ko-KR")}주 매수 완료 (${price.toLocaleString("ko-KR")}원)`,
      );
      setQtyDigits("");
    } catch {
      showToast("네트워크 오류가 발생했습니다.");
    } finally {
      setIsBuying(false);
    }
  }, [isButtonDisabled, stockId, qtyDigits, showToast]);

  useEffect(() => {
    const es = new EventSource(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/stocks/${stockCode}/sse`);

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
        <section className={styles.card} aria-label="구매 가격">
          <div className={styles.priceLabelRow}>
            <p className={styles.priceLabel}>구매할 가격(시장가)</p>
            <button
              type="button"
              className={styles.infoBtn}
              onClick={() => setShowPriceInfo((v) => !v)}
              aria-label="가격 안내"
            >
              ?
            </button>
          </div>
          {showPriceInfo && (
            <p className={styles.priceNotice}>
              구매 버튼을 누른 순간보다 가격이 2% 넘게 올랐거나,<br />
              실시간 시세가 10초 넘게 지연된 경우 구매되지 않아요.<br />
              더 싸게 구매할 수 있으면 그대로 진행돼요.
            </p>
          )}
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
                <span className={styles.qtyPlaceholder}>몇 주 구매할까요?</span>
              </>
            )}
          </div>
          <p className={styles.subInfo}>
            {qtyDigits && currentPrice !== null
              ? `총 ${formatKrw(Number(qtyDigits) * currentPrice)}`
              : "구매가능 0원 · 최대 0주"}
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
          {isBuying ? "처리 중..." : "구매하기"}
        </button>
      </footer>
    </div>
  );
}
