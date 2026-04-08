"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
    Search, 
    Filter, 
    Download,
    ArrowUpRight,
    ArrowDownRight,
    Calendar
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function TradeHistory() {
    const { data: trades, isLoading } = useQuery({
        queryKey: ["trades"],
        queryFn: () => api.getTrades(100),
    });

    return (
        <div className="space-y-8 pb-12">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Trade History</h1>
                    <p className="text-zinc-500 font-medium">Comprehensive log of all executed and closed positions.</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-orange-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Filter symbol..." 
                            className="bg-white/5 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-all"
                        />
                    </div>
                    <button className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-400 hover:text-white transition-all">
                        <Filter className="h-4 w-4" />
                        Filter
                    </button>
                    <button className="flex items-center gap-2 rounded-xl bg-orange-500/10 border border-orange-500/20 px-4 py-2 text-sm font-semibold text-orange-500 hover:bg-orange-500 hover:text-white transition-all">
                        <Download className="h-4 w-4" />
                        Export CSV
                    </button>
                </div>
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="overflow-hidden rounded-3xl border border-white/5 bg-zinc-900/40 backdrop-blur-md"
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500">Asset</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500">Side</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500">Entry / Exit</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500">PnL ($)</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500">Result</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {isLoading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-6 py-6">
                                            <div className="h-6 w-full rounded-lg bg-white/5" />
                                        </td>
                                    </tr>
                                ))
                            ) : trades?.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <p className="text-zinc-500 font-medium">No trade history found.</p>
                                    </td>
                                </tr>
                            ) : (
                                trades?.map((trade) => (
                                    <tr key={trade.id} className="group hover:bg-white/[0.01] transition-colors">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/5 font-bold text-xs">
                                                    {trade.symbol.substring(0, 3)}
                                                </div>
                                                <span className="font-bold text-white uppercase">{trade.symbol}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={cn(
                                                "rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest",
                                                trade.side === "BUY" ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
                                            )}>
                                                {trade.side}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-white">${trade.entry_price.toFixed(2)}</span>
                                                <span className="text-[10px] text-zinc-500 font-semibold uppercase">→ ${trade.exit_price.toFixed(2)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 font-mono text-sm font-bold">
                                            <span className={trade.pnl >= 0 ? "text-green-500" : "text-red-500"}>
                                                {trade.pnl >= 0 ? "+" : ""}${Math.abs(trade.pnl).toFixed(2)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className={cn(
                                                "flex w-fit items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                                                trade.pnl >= 0 
                                                    ? "bg-green-500/20 text-green-400 border border-green-500/20" 
                                                    : "bg-red-500/20 text-red-400 border border-red-500/20"
                                            )}>
                                                {trade.pnl >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                                {trade.pnl >= 0 ? "Win" : "Loss"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2 text-zinc-500 text-sm font-medium">
                                                <Calendar className="h-4 w-4" />
                                                <span>2024-05-12</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                
                <div className="flex items-center justify-between border-t border-white/5 bg-white/[0.02] px-8 py-4">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Showing 1-10 of 124 Trades</span>
                    <div className="flex gap-2">
                        <button className="rounded-lg border border-white/5 bg-white/5 px-3 py-1.5 text-xs font-bold text-zinc-500 hover:text-white transition-all disabled:opacity-50" disabled>Previous</button>
                        <button className="rounded-lg border border-white/5 bg-white/5 px-3 py-1.5 text-xs font-bold text-zinc-500 hover:text-white transition-all">Next</button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
