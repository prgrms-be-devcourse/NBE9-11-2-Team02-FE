'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { StockBasicInfo, StockPriceInfo, ChartRes } from '@/type/stock';

import {
    createChart,
    LineSeries,
    IChartApi,
    ISeriesApi,
    ColorType,
} from 'lightweight-charts';

// ─────────────────────────────────────────────
// 타입
// ─────────────────────────────────────────────
type ChartPeriod = '3M' | '1Y';

const formatPrice = (n: number) => n.toLocaleString('ko-KR');

// ─────────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────────
export default function StockDetailPage() {
    const params = useParams();
    const router = useRouter();
    const stockCode = params?.stockCode as string;

    const [stockInfo, setStockInfo] = useState<StockBasicInfo | null>(null);
    const [priceInfo, setPriceInfo] = useState<StockPriceInfo | null>(null);
    const [period, setPeriod] = useState<ChartPeriod>('3M');
    const [chartHighLow, setChartHighLow] = useState<{ high: number; low: number } | null>(null);

    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<'Line'> | null>(null);

    // changeSign 1,2,3 = 상승/보합, 4,5 = 하락
    const isPositive = !['4', '5'].includes(priceInfo?.changeSign ?? '');

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/stocks/${stockCode}`)
            .then((res) => res.json())
            .then((body) => {
                setStockInfo({
                    stockCode: body.data.stockCode,
                    stockName: body.data.stockName,
                });
            });
    }, [stockCode]);

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/stocks/${stockCode}/chart?period=${period}`)
            .then((res) => res.json())
            .then((body: ChartRes) => {
                if (!seriesRef.current) return;
                const data = body.candles.map((c) => ({
                    time: c.time as any,
                    value: Number(c.close),
                }));

                const prices = body.candles.map((c) => Number(c.close));
                setChartHighLow({
                    high: Math.max(...prices),
                    low: Math.min(...prices),
                });

                seriesRef.current.setData(data);
                chartRef.current?.timeScale().fitContent();
            });
    }, [stockCode, period]);

    useEffect(() => {
        const es = new EventSource(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/stocks/${stockCode}/sse`);

        es.onmessage = (e) => {
            const data = JSON.parse(e.data);
            setPriceInfo({
                price: data.price,
                changeSign: data.changeSign,
                change: data.change,
                changeRate: data.changeRate,
                tradeTime: data.tradeTime,
            });
        };

        es.onerror = () => es.close();

        return () => es.close();
    }, [stockCode]);

    // ── 차트 초기화 ──────────────────────────────
    useEffect(() => {
        if (!chartContainerRef.current) return;

        chartRef.current = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: '#fdfbff' },
                textColor: '#7a7a7a',
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
                horzLine: { color: '#e4dff0', labelBackgroundColor: '#111111' },
                vertLine: { color: '#e4dff0', labelBackgroundColor: '#111111' },
            },
            handleScroll: false,
            handleScale: false,
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
        });

        seriesRef.current = chartRef.current.addSeries(LineSeries, {
            color: isPositive ? '#d94f4c' : '#4468c4',
            lineWidth: 2,
            crosshairMarkerVisible: true,
            crosshairMarkerRadius: 5,
            priceLineVisible: false,
            lastValueVisible: false,
        });

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
    }, []);

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
                            {stockInfo?.stockName}
                        </p>
                        <h1 className="text-4xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                            {formatPrice(Number(priceInfo?.price ?? 0))}
                            <span className="text-2xl font-medium ml-1">원</span>
                        </h1>
                        <div className="flex items-center gap-1.5 mt-2">
                            <span
                                className="text-sm font-medium"
                                style={{ color: isPositive ? 'var(--price-up)' : 'var(--price-down)' }}
                            >
                                {isPositive ? '▲' : '▼'} {formatPrice(Math.abs(Number(priceInfo?.change ?? 0)))}원
                            </span>
                            <span
                                className="text-sm"
                                style={{ color: isPositive ? 'var(--price-up)' : 'var(--price-down)' }}
                            >
                                ({isPositive ? '+' : ''}{Number(priceInfo?.changeRate ?? 0).toFixed(1)}%)
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
                                    고가 {formatPrice(chartHighLow?.high ?? 0)}원
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full" style={{ background: 'var(--price-down)' }} />
                                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                    저가 {formatPrice(chartHighLow?.low ?? 0)}원
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