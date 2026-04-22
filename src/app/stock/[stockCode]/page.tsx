'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    createChart,
    LineSeries,
    IChartApi,
    ISeriesApi,
    LineData,
    ColorType,
    LineStyle,
} from 'lightweight-charts';

// ─────────────────────────────────────────────
// 타입
// ─────────────────────────────────────────────
type ChartPeriod = '3M' | '1Y';

interface StockInfo {
    stockCode: string;
    stockName: string;
    currentPrice: number;
    priceChange: number;
    changeRate: number;
    highPrice: number;
    lowPrice: number;
}

// ─────────────────────────────────────────────
// 목업 데이터 (실제 연동 전 임시)
// ─────────────────────────────────────────────
const MOCK_STOCK: StockInfo = {
    stockCode: '005930',
    stockName: '삼성전자',
    currentPrice: 207_000,
    priceChange: 3_000,
    changeRate: 1.4,
    highPrice: 211_000,
    lowPrice: 205_000,
};

function generateMockChartData(period: ChartPeriod): LineData[] {
    const now = new Date();
    const days = period === '3M' ? 90 : 365;
    const data: LineData[] = [];
    let price = 200_000;

    for (let i = days; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        if (date.getDay() === 0 || date.getDay() === 6) continue;

        price += (Math.random() - 0.48) * 2_000;
        price = Math.max(195_000, Math.min(220_000, price));

        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');

        data.push({ time: `${yyyy}-${mm}-${dd}` as any, value: Math.round(price) });
    }
    return data;
}

const formatPrice = (n: number) => n.toLocaleString('ko-KR');

// ─────────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────────
export default function StockDetailPage() {
    const params = useParams();
    const router = useRouter();
    const stockCode = params?.stockCode as string;

    const [stock] = useState<StockInfo>(MOCK_STOCK);
    const [period, setPeriod] = useState<ChartPeriod>('3M');

    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<'Line'> | null>(null);

    const isPositive = stock.priceChange >= 0;

    // ── 차트 초기화 ──────────────────────────────
    useEffect(() => {
        if (!chartContainerRef.current) return;

        chartRef.current = createChart(chartContainerRef.current, {
            layout: {
                // global.css --bg-page 와 맞춤
                background: { type: ColorType.Solid, color: '#fdfbff' },
                textColor: '#7a7a7a', // --text-tertiary
                // Pretendard 는 global.css body 에 이미 선언됨 → 중복 제거
            },
            grid: {
                vertLines: { visible: false },
                horzLines: { visible: false },
            },
            localization: {
                priceFormatter: (price: number) => Math.round(price).toLocaleString('ko-KR'),
              },
            rightPriceScale: {
                borderColor: 'transparent',
                scaleMargins: { top: 0.1, bottom: 0.1 },
            },
            timeScale: {
                borderColor: 'transparent',
                fixLeftEdge: true,
                fixRightEdge: true,
            },
            crosshair: {
                horzLine: { color: '#e4dff0', labelBackgroundColor: '#111111' }, // --border-soft / --text-primary
                vertLine: { color: '#e4dff0', labelBackgroundColor: '#111111' },
            },
            handleScroll: false,
            handleScale: false,
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
        });

        // v5 API
        seriesRef.current = chartRef.current.addSeries(LineSeries, {
            color: isPositive ? '#d94f4c' : '#4468c4', // --price-up / --price-down
            lineWidth: 2,
            crosshairMarkerVisible: true,
            crosshairMarkerRadius: 5,
            priceLineVisible: false,
            lastValueVisible: false,
        });

        seriesRef.current.setData(generateMockChartData(period));
        chartRef.current.timeScale().fitContent();

        const observer = new ResizeObserver(() => {
            if (chartContainerRef.current && chartRef.current) {
                chartRef.current.applyOptions({
                    width: chartContainerRef.current.clientWidth,
                });
            }
        });
        observer.observe(chartContainerRef.current);

        return () => {
            observer.disconnect();
            chartRef.current?.remove();
            chartRef.current = null;
            seriesRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── 기간 변경 시 데이터 교체 ─────────────────
    useEffect(() => {
        if (!seriesRef.current || !chartRef.current) return;
        seriesRef.current.setData(generateMockChartData(period));
        chartRef.current.timeScale().fitContent();
    }, [period]);

    // ─────────────────────────────────────────────
    // 렌더
    // ─────────────────────────────────────────────
    return (
        <div className="app-shell">
            <div className="mobile-container">

                {/* ── 헤더 ── */}
                <header className="sticky top-0 z-10 border-[var(--border-soft)]"
                    style={{ background: 'var(--bg-page)' }}>
                    <div className="px-4 h-14 flex items-center gap-3">
                        <button
                            onClick={() => router.back()}
                            className="p-2 -ml-2 rounded-full transition-colors"
                            style={{ color: 'var(--text-primary)' }}
                            aria-label="뒤로가기"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-5 h-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    </div>
                </header>

                {/* ── 본문 ── */}
                <main className="flex-1 px-4 pb-6"
                    style={{ background: 'var(--bg-page)', paddingLeft: '1.25rem', paddingRight: '0.5rem', paddingBottom: '1.5rem' }}>

                    {/* 시세 정보 */}
                    <section className="pt-6 pb-5">
                        <p className="text-lg mb-1" style={{ color: 'var(--text-secondary)' }}>
                            {stock.stockName}
                        </p>
                        <h1 className="text-4xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                            {formatPrice(stock.currentPrice)}
                            <span className="text-2xl font-medium ml-1">원</span>
                        </h1>
                        <div className="flex items-center gap-1.5 mt-2">
                            <span
                                className="text-sm font-medium"
                                style={{ color: isPositive ? 'var(--price-up)' : 'var(--price-down)' }}
                            >
                                {isPositive ? '▲' : '▼'} {formatPrice(Math.abs(stock.priceChange))}원
                            </span>
                            <span
                                className="text-sm"
                                style={{ color: isPositive ? 'var(--price-up)' : 'var(--price-down)' }}
                            >
                                ({isPositive ? '+' : '-'}{Math.abs(stock.changeRate).toFixed(1)}%)
                            </span>
                            <span className="text-xs ml-1" style={{ color: 'var(--text-tertiary)' }}>
                                전일 대비
                            </span>
                        </div>
                    </section>

                    {/* 차트 섹션 */}
                    <section>

                        {/* 고가 / 저가 범례 */}
                        <div className="flex items-center gap-4 mb-3">
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full" style={{ background: 'var(--price-up)' }} />
                                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                    고가 {formatPrice(stock.highPrice)}원
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full" style={{ background: 'var(--price-down)' }} />
                                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                    저가 {formatPrice(stock.lowPrice)}원
                                </span>
                            </div>
                        </div>

                        <div className="h-px mb-5" style={{ background: 'var(--border-soft)' }} />

                        {/* lightweight-charts 컨테이너 */}
                        <div
                            ref={chartContainerRef}
                            className="w-full h-64 rounded-xl overflow-hidden"
                        />

                    </section>

                    {/* 기간 탭 */}
                    <div className="flex gap-1 rounded-lg p-1 w-fit mb-4" style={{ background: 'var(--bg-section)' }}>
                        {(['3M', '1Y'] as ChartPeriod[]).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className="px-3 py-1 rounded-md text-sm font-medium transition-all"
                                style={
                                    period === p
                                        ? { background: 'var(--bg-page)', color: 'var(--text-primary)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', paddingLeft: '1.25rem', paddingRight: '1.25rem', paddingTop: '0.625rem', paddingBottom: '0.625rem', fontSize: '0.8rem' }
                                        : { color: 'var(--text-tertiary)', paddingLeft: '1.25rem', paddingRight: '1.25rem', paddingTop: '0.625rem', paddingBottom: '0.625rem', fontSize: '0.8rem' }
                                }
                            >
                                {p === '3M' ? '3개월' : '1년'}
                            </button>
                        ))}
                    </div>
                </main>

                {/* ── 하단 고정 버튼 ── */}
                <footer
                    className="sticky bottom-0 px-4 pt-3 pb-6"
                    style={{
                        background: 'var(--mobile-surface)',
                        paddingLeft: '1rem', paddingRight: '1rem', paddingTop: '0.7rem', paddingBottom: '1.2rem'
                    }}
                >
                    <div className="flex gap-1">
                        <button
                            className="flex-1 py-3.5 rounded-2xl text-white text-base font-bold transition-all active:scale-95"
                            style={{ background: 'var(--price-down)', paddingTop: '1.25rem', paddingBottom: '1.25rem' }}
                        >
                            판매하기
                        </button>
                        <button
                            className="flex-1 py-3.5 rounded-2xl text-white text-base font-bold transition-all active:scale-95"
                            style={{ background: 'var(--price-up)', paddingTop: '1.25rem', paddingBottom: '1.25rem' }}
                        >
                            구매하기
                        </button>
                    </div>
                </footer>

            </div>
        </div>
    );
}