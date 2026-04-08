import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

export async function fetcher<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options?.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(error.message || "API request failed");
    }

    return response.json();
}

/**
 * API Data Models (Sync with Rust Core)
 */

export interface Position {
    id: string;
    symbol: string;
    side: "LONG" | "SHORT";
    entry_price: number;
    size: number;
    status: "OPEN" | "CLOSED";
}

export interface Trade {
    id: string;
    symbol: string;
    side: string;
    entry_price: number;
    exit_price: number;
    pnl: number;
    close_time?: string;
    mistake_type?: string;
    ai_feedback?: string;
}

export interface Performance {
    date: string;
    total_pnl: number;
    open_positions: number;
    win_rate: number;
}

export interface SymbolConfig {
    symbol: string;
    is_active: boolean;
}

export interface Setting {
    key: string;
    value: string;
    category: string;
    description?: string;
}

export interface SndZone {
    id: number;
    symbol_id: number;
    timeframe: string;
    zone_type: "DEMAND" | "SUPPLY";
    price_high: number;
    price_low: number;
    grade: string;
    test_count: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface ElliottWave {
    id: number;
    symbol_id: number;
    timeframe: string;
    current_wave: string;
    wave_type: string;
    invalidation_price?: number;
    confidence: number;
    created_at: string;
}

export interface SignalItem<T> {
    symbol: string;
    data: T;
}

export interface SignalResponse {
    snd_zones: SignalItem<SndZone>[];
    elliott_waves: SignalItem<ElliottWave>[];
}

/**
 * API Methods
 */

export const api = {
    getPositions: () => fetcher<Position[]>("/positions"),
    getTrades: (limit = 50, offset = 0) => fetcher<Trade[]>(`/trades?limit=${limit}&offset=${offset}`),
    getPerformance: (date?: string) => fetcher<Performance>(`/performance${date ? `?date=${date}` : ""}`),
    getPerformanceHistory: () => fetcher<Performance[]>("/performance/history"),
    getSettings: () => fetcher<Setting[]>("/settings"),
    updateSetting: (key: string, value: string) => fetcher<void>(`/settings/${key}`, {
        method: "POST",
        body: JSON.stringify({ value }),
    }),
    getSymbols: () => fetcher<SymbolConfig[]>("/symbols"),
    addSymbol: (symbol: string) => fetcher<void>("/symbols", {
        method: "POST",
        body: JSON.stringify({ symbol }),
    }),
    removeSymbol: (symbol: string) => fetcher<void>(`/symbols/${symbol}`, {
        method: "DELETE",
    }),
    triggerEmergency: () => fetcher<void>("/emergency", {
        method: "POST",
    }),
    getSignals: () => fetcher<SignalResponse>("/signals"),
};
