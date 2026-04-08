"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType, IChartApi, CandlestickSeries } from "lightweight-charts";

interface MainChartProps {
    symbol: string;
}

export function MainChart({ symbol }: MainChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);

    useEffect(() => {
        if (!chartContainerRef.current) return;

        const handleResize = () => {
            if (chartContainerRef.current) {
                chartRef.current?.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: "transparent" },
                textColor: "#a1a1aa",
            },
            grid: {
                vertLines: { color: "rgba(255, 255, 255, 0.03)" },
                horzLines: { color: "rgba(255, 255, 255, 0.03)" },
            },
            width: chartContainerRef.current.clientWidth,
            height: 400,
            timeScale: {
                borderColor: "rgba(255, 255, 255, 0.1)",
                timeVisible: true,
                secondsVisible: false,
            },
            crosshair: {
                mode: 1,
            }
        });

        const candlestickSeries = chart.addSeries(CandlestickSeries, {
            upColor: "#10b981",
            downColor: "#ef4444",
            borderVisible: false,
            wickUpColor: "#10b981",
            wickDownColor: "#ef4444",
        });

        // Mock data for initial view
        const data = generateDummyData();
        candlestickSeries.setData(data);

        chart.timeScale().fitContent();
        chartRef.current = chart;

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            chart.remove();
        };
    }, [symbol]);

    return (
        <div className="relative w-full rounded-2xl border border-white/5 bg-zinc-900/40 p-4 backdrop-blur-md">
            <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-4">
                    <h3 className="text-xl font-bold text-white uppercase">{symbol} <span className="text-zinc-500 font-medium">Binance</span></h3>
                    <div className="flex gap-1">
                        {["15m", "1H", "4H", "1D"].map(tf => (
                            <button key={tf} className="px-2.5 py-1 text-[10px] font-bold rounded-md bg-white/5 text-zinc-400 hover:bg-orange-500/10 hover:text-orange-500 transition-colors uppercase">
                                {tf}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold">
                    <div className="flex gap-2">
                        <span className="text-zinc-500">H: <span className="text-white">99,200</span></span>
                        <span className="text-zinc-500">L: <span className="text-white">94,000</span></span>
                    </div>
                    <span className="text-green-500 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">+1.24%</span>
                </div>
            </div>
            <div ref={chartContainerRef} className="w-full h-full min-h-[400px]" />
        </div>
    );
}

function generateDummyData() {
    const data = [];
    let currentPrice = 95000;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    currentDate.setDate(currentDate.getDate() - 50);

    for (let i = 0; i < 50; i++) {
        const isUp = Math.random() > 0.45;
        const volatility = Math.random() * 500 + 100;
        const open = currentPrice;
        let close, high, low;

        if (isUp) {
            close = open + volatility;
            high = close + (Math.random() * 200);
            low = open - (Math.random() * 200);
        } else {
            close = open - volatility;
            high = open + (Math.random() * 200);
            low = close - (Math.random() * 200);
        }

        currentPrice = close;
        const time = Math.floor(currentDate.getTime() / 1000);

        data.push({ time, open, high, low, close });
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return data;
}
