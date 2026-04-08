"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
    Star, 
    ArrowUpRight, 
    ArrowDownRight,
    Search,
    Plus,
    X,
    Loader2,
    Zap,
    CircleDashed
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export function WatchlistPanel() {
    const queryClient = useQueryClient();
    const [isAdding, setIsAdding] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const { data: symbols, isLoading } = useQuery({
        queryKey: ["symbols"],
        queryFn: () => api.getSymbols(),
        refetchInterval: 3000, // Poll for sync status updates
    });

    const { data: binanceMarkets, isLoading: isLoadingMarkets } = useQuery({
        queryKey: ["binanceMarkets"],
        queryFn: () => api.getBinanceMarkets(),
        enabled: isAdding, // Only fetch when modal is open
    });

    const addMutation = useMutation({
        mutationFn: (symbol: string) => api.addSymbol(symbol),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["symbols"] });
            setIsAdding(false);
            setSearchQuery("");
        },
    });

    const filteredMarkets = binanceMarkets?.filter(m => 
        m.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 10);

    return (
        <div className="flex flex-col h-full rounded-3xl border border-white/5 bg-zinc-900/40 backdrop-blur-md overflow-hidden relative">
            <div className="p-6 border-b border-white/5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">Watchlist</h3>
                    <button 
                        onClick={() => setIsAdding(true)}
                        className="p-2 rounded-xl bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white transition-all"
                    >
                        <Plus className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-4 space-y-1 scrollbar-hide">
                {isLoading ? (
                    [1,2,3,4,5].map(i => <div key={i} className="h-12 w-full animate-pulse rounded-xl bg-white/5 m-2" />)
                ) : Array.isArray(symbols) ? (
                    symbols.map((sym, index) => (
                        <motion.div
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
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-bold text-white uppercase tracking-tight">{sym.symbol}</p>
                                        {sym.sync_status === "LIVE" ? (
                                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-green-500/10 text-[8px] font-black text-green-500 animate-pulse border border-green-500/20">
                                                <Zap className="h-2 w-2 fill-green-500" />
                                                LIVE
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-orange-500/10 text-[8px] font-black text-orange-500 border border-orange-500/20">
                                                <CircleDashed className="h-2 w-2 animate-spin" />
                                                SYNCING
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-zinc-500 font-semibold">Binance Futures</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-white">---</p>
                                <div className="flex items-center justify-end gap-1 text-[10px] font-black text-zinc-600 uppercase">
                                    <ArrowUpRight className="h-2.5 w-2.5" />
                                    0.0%
                                </div>
                            </div>
                        </motion.div>
                    ))
                ) : null}
            </div>

            {/* Market Search Modal Overlay */}
            <AnimatePresence>
                {isAdding && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 bg-zinc-950/90 backdrop-blur-xl p-4 flex flex-col"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="text-sm font-bold text-white">Add Market</h4>
                            <button 
                                onClick={() => setIsAdding(false)}
                                className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                            <input 
                                autoFocus
                                type="text" 
                                placeholder="Search futures markets (e.g. BTCUSDT)..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-all font-medium"
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-1 scrollbar-hide">
                            {isLoadingMarkets ? (
                                <div className="flex items-center justify-center py-10">
                                    <Loader2 className="h-6 w-6 text-orange-500 animate-spin" />
                                </div>
                            ) : filteredMarkets?.length ? (
                                filteredMarkets.map((market) => (
                                    <button
                                        key={market.symbol}
                                        onClick={() => addMutation.mutate(market.symbol)}
                                        disabled={addMutation.isPending}
                                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 group"
                                    >
                                        <div className="flex flex-col items-start">
                                            <span className="text-sm font-bold text-white group-hover:text-orange-500 transition-colors">{market.symbol}</span>
                                            <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest">{market.quoteAsset}-M Futures</span>
                                        </div>
                                        {addMutation.isPending && addMutation.variables === market.symbol ? (
                                            <Loader2 className="h-4 w-4 text-orange-500 animate-spin" />
                                        ) : (
                                            <Plus className="h-4 w-4 text-zinc-600 group-hover:text-orange-500" />
                                        )}
                                    </button>
                                ))
                            ) : searchQuery ? (
                                <div className="text-center py-10 text-zinc-500 text-xs">No markets found for "{searchQuery}"</div>
                            ) : (
                                <div className="text-center py-10 text-zinc-500 text-xs">Start typing to search markets...</div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
