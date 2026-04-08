"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
    Star, 
    ArrowUpRight, 
    ArrowDownRight,
    Search,
    Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function WatchlistPanel() {
    const { data: symbols, isLoading } = useQuery({
        queryKey: ["symbols"],
        queryFn: () => api.getSymbols(),
    });

    return (
        <div className="flex flex-col h-full rounded-3xl border border-white/5 bg-zinc-900/40 backdrop-blur-md overflow-hidden">
            <div className="p-6 border-b border-white/5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">Watchlist</h3>
                    <button className="p-2 rounded-xl bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white transition-all">
                        <Plus className="h-4 w-4" />
                    </button>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                    <input 
                        type="text" 
                        placeholder="Search symbols..."
                        className="w-full bg-white/5 border border-white/5 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-4 space-y-1 scrollbar-hide">
                {isLoading ? (
                    [1,2,3,4,5].map(i => <div key={i} className="h-12 w-full animate-pulse rounded-xl bg-white/5 m-2" />)
                ) : Array.isArray(symbols) ? (
                    symbols.map((sym, index) => (
                        <motion.button
                            key={sym.symbol}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="group w-full flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-white/5 transition-all text-left"
                        >
                            <div className="flex items-center gap-3">
                                <Star className={cn(
                                    "h-3.5 w-3.5 transition-colors",
                                    index < 3 ? "text-orange-500 fill-orange-500" : "text-zinc-700 group-hover:text-zinc-500"
                                )} />
                                <div>
                                    <p className="text-sm font-bold text-white uppercase tracking-tight">{sym.symbol}</p>
                                    <p className="text-[10px] text-zinc-500 font-semibold">Binance Spot</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-white">$95,420</p>
                                <div className="flex items-center justify-end gap-1 text-[10px] font-black text-green-500 uppercase">
                                    <ArrowUpRight className="h-2.5 w-2.5" />
                                    2.4%
                                </div>
                            </div>
                        </motion.button>
                    ))
                ) : null}
            </div>
        </div>
    );
}
