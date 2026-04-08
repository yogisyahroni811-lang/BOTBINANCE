"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL } from "@/lib/api";
import { toast } from "sonner";

export function useLiveData() {
    const queryClient = useQueryClient();

    useEffect(() => {
        // Construct the full SSE URL
        const sseUrl = `${API_BASE_URL}/sse`;
        const eventSource = new EventSource(sseUrl);

        eventSource.onopen = () => {
            console.log("SSE Connection established");
            toast.info("Neural link established", {
                description: "Real-time trading data is active.",
                className: "bg-zinc-900 border-zinc-800 text-white font-bold",
            });
        };

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log("Real-time event received:", data);

                // Strategy: Invalidate relevant queries based on event type
                // or just invalidate all trading data for a catch-all solution
                if (data.type === "TRADE_UPDATE" || data.type === "POSITION_UPDATE") {
                    queryClient.invalidateQueries({ queryKey: ["positions"] });
                    queryClient.invalidateQueries({ queryKey: ["trades"] });
                    queryClient.invalidateQueries({ queryKey: ["performance"] });
                    
                    toast.info(`${data.type}: ${data.symbol}`, {
                        description: `Price: ${data.price} | PnL: ${data.pnl}`,
                        className: "bg-zinc-900 border-zinc-800 text-white font-bold",
                    });
                }

                if (data.type === "HEARTBEAT") {
                    // Just log or update health status in a global state if needed
                }

                // For a truly real-time dashboard, we might want to manually 
                // update the cache instead of just invalidating, but invalidating 
                // is safer for S++ Yolo robustness.
            } catch (err) {
                console.error("Failed to parse SSE message:", err);
            }
        };

        eventSource.onerror = (err) => {
            console.error("SSE Connection error:", err);
            // eventSource.close(); // Don't close, let it auto-reconnect
        };

        return () => {
            eventSource.close();
            console.log("SSE Connection closed");
        };
    }, [queryClient]);
}
