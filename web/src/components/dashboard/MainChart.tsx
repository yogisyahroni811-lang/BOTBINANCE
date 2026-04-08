"use client";

import React, { useEffect, useRef } from "react";
import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickSeries } from "lightweight-charts";

interface MainChartProps {
  data?: any[];
}

export function MainChart({ data }: MainChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Initialize chart with premium dark aesthetics
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "hsl(240, 5%, 65%)",
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.05)" },
        horzLines: { color: "rgba(255, 255, 255, 0.05)" },
      },
      rightPriceScale: {
        borderColor: "rgba(255, 255, 255, 0.1)",
      },
      timeScale: {
        borderColor: "rgba(255, 255, 255, 0.1)",
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: 1, // Normal crosshair
        vertLine: {
          color: "rgba(255, 255, 255, 0.2)",
          width: 1,
          style: 3, // Dashed
          labelBackgroundColor: "hsl(250, 80%, 60%)",
        },
        horzLine: {
          color: "rgba(255, 255, 255, 0.2)",
          width: 1,
          style: 3, // Dashed
          labelBackgroundColor: "hsl(250, 80%, 60%)",
        },
      },
    });

    chartRef.current = chart;

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "hsl(142, 71%, 45%)", // emerald-500
      downColor: "hsl(348, 83%, 47%)", // rose-500
      borderVisible: false,
      wickUpColor: "hsl(142, 71%, 45%)",
      wickDownColor: "hsl(348, 83%, 47%)",
    });

    // Generate some dummy data to display
    const currentData = data || generateDummyData();
    candlestickSeries.setData(currentData);

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    // Initial resize
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [data]);

  return (
    <div className="w-full h-[400px] md:h-[500px] relative rounded-xl border border-white/5 bg-card/40 backdrop-blur-xl overflow-hidden shadow-lg hover:border-white/10 transition-colors">
      <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg">BTC/USDT</span>
          <span className="text-xs text-muted-foreground bg-white/5 px-2 py-1 rounded">1H</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-emerald-500 font-medium">+1.24%</span>
          <span className="text-muted-foreground">Vol: 14.5K</span>
        </div>
      </div>
      <div ref={chartContainerRef} className="w-full h-full" />
    </div>
  );
}

// Dummy data generator for aesthetics
function generateDummyData() {
  const data = [];
  let currentPrice = 95000;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  currentDate.setDate(currentDate.getDate() - 100);

  for (let i = 0; i < 100; i++) {
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
    
    // Proper timestamp format for lightweight-charts (unix timestamp in seconds or business day string)
    const time = Math.floor(currentDate.getTime() / 1000);

    data.push({
      time: time,
      open: open,
      high: high,
      low: low,
      close: close,
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return data;
}
