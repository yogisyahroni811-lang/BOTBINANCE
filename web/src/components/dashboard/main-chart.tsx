import { useEffect, useRef, useState } from "react";
import { createChart, ColorType, IChartApi, CandlestickSeries } from "lightweight-charts";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface MainChartProps {
    symbol: string;
}

export function MainChart({ symbol }: MainChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<any>(null);
    const [interval, setInterval] = useState("1h");

    const { data: klines, isLoading } = useQuery({
        queryKey: ["klines", symbol, interval],
        queryFn: () => api.getKlines(symbol, interval),
        refetchInterval: 60000,
    });

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
        });

        const series = chart.addSeries(CandlestickSeries, {
            upColor: "#10b981",
            downColor: "#ef4444",
            borderVisible: false,
            wickUpColor: "#10b981",
            wickDownColor: "#ef4444",
        });

        seriesRef.current = series;
        chartRef.current = chart;

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            chart.remove();
        };
    }, []);

    useEffect(() => {
        if (klines && seriesRef.current) {
            const formattedData = klines.map(k => ({
                time: (k[0] / 1000) as any,
                open: parseFloat(k[1]),
                high: parseFloat(k[2]),
                low: parseFloat(k[3]),
                close: parseFloat(k[4]),
            }));
            seriesRef.current.setData(formattedData);
            chartRef.current?.timeScale().fitContent();
        }
    }, [klines]);

    const activeKline = klines?.[klines.length - 1];
    const currentPrice = activeKline ? parseFloat(activeKline[4]) : null;
    const prevPrice = klines?.[klines.length - 2] ? parseFloat(klines[klines.length - 2][4]) : null;
    const changePct = currentPrice && prevPrice ? ((currentPrice - prevPrice) / prevPrice * 100).toFixed(2) : "0.00";

    return (
        <div className="relative w-full rounded-2xl border border-white/5 bg-zinc-900/40 p-4 backdrop-blur-md">
            <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-4">
                    <h3 className="text-xl font-bold text-white uppercase">{symbol} <span className="text-zinc-500 font-medium text-xs">Binance Futures</span></h3>
                    <div className="flex gap-1">
                        {["15m", "1h", "4h", "1d"].map(tf => (
                            <button 
                                key={tf} 
                                onClick={() => setInterval(tf)}
                                className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-colors uppercase ${interval === tf ? "bg-orange-500 text-white" : "bg-white/5 text-zinc-400 hover:bg-orange-500/10 hover:text-orange-500"}`}
                            >
                                {tf}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold">
                    <div className="flex gap-2">
                        <span className="text-zinc-500">Price: <span className="text-white font-mono">{currentPrice?.toLocaleString() || "---"}</span></span>
                    </div>
                    <span className={`px-2 py-0.5 rounded border ${parseFloat(changePct) >= 0 ? "text-green-500 bg-green-500/10 border-green-500/20" : "text-red-500 bg-red-500/10 border-red-500/20"}`}>
                        {parseFloat(changePct) >= 0 ? "+" : ""}{changePct}%
                    </span>
                </div>
            </div>
            
            {isLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-950/20 backdrop-blur-sm rounded-2xl">
                    <div className="h-8 w-8 rounded-full border-2 border-orange-500/30 border-t-orange-500 animate-spin" />
                </div>
            )}
            
            <div ref={chartContainerRef} className="w-full h-full min-h-[400px]" />
        </div>
    );
}

