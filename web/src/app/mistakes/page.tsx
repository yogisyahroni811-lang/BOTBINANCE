"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
    Brain, 
    Zap, 
    AlertCircle,
    Target,
    ArrowRight,
    Search
} from "lucide-react";
import { motion } from "framer-motion";

export default function MistakesPage() {
    // Filter trades with PnL < 0 (Mistakes)
    const { data: trades, isLoading } = useQuery({
        queryKey: ["trades", "mistakes"],
        queryFn: () => api.getTrades(50),
        select: (data) => data.filter(t => t.pnl < 0)
    });

    return (
        <div className="space-y-8 pb-12">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-white mb-2 underline decoration-red-500/30 underline-offset-8">Mistake Log</h1>
                    <p className="text-zinc-500 font-medium">Post-mortem analysis of failed executions and algorithmic errors.</p>
                </div>
                <div className="flex items-center gap-4 bg-red-500/5 border border-red-500/10 px-5 py-3 rounded-2xl">
                    <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center">
                        <Brain className="h-5 w-5 text-red-500" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">AI Analyst</p>
                        <p className="text-sm font-semibold text-white leading-none tracking-tight">Pattern recognition active</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    {isLoading ? (
                        [1,2,3].map(i => <div key={i} className="h-40 w-full animate-pulse rounded-3xl bg-white/5" />)
                    ) : (trades?.length === 0) ? (
                        <div className="flex flex-col items-center justify-center p-20 rounded-3xl border border-dashed border-white/10 bg-white/[0.01]">
                            <Zap className="h-12 w-12 text-zinc-700 mb-4" />
                            <p className="text-zinc-500 font-bold">Perfect execution detected. No mistakes log available.</p>
                        </div>
                    ) : (
                        trades?.map((trade) => (
                            <motion.div 
                                key={trade.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="group relative overflow-hidden rounded-3xl border border-white/5 bg-zinc-900/40 p-8 backdrop-blur-md hover:border-red-500/20 transition-all"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20">
                                            <AlertCircle className="h-6 w-6 text-red-500" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-xl font-bold text-white uppercase">{trade.symbol}</h3>
                                                <span className="text-xs font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-md">LOSS</span>
                                            </div>
                                            <p className="text-sm text-zinc-500 mt-1 font-medium">PnL: <span className="text-red-400">-${Math.abs(trade.pnl).toFixed(2)}</span></p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex flex-col items-end">
                                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Time Elapsed</span>
                                            <span className="text-sm font-bold text-white italic">0h 42m</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="rounded-2xl bg-white/5 border border-white/5 p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Target className="h-4 w-4 text-orange-500" />
                                            <span className="text-xs font-bold text-zinc-400 uppercase">Detection</span>
                                        </div>
                                        <p className="text-sm text-white font-medium leading-relaxed">
                                            Invalidation monitor triggered at <span className="text-orange-400">${(trade.exit_price * 1.02).toFixed(2)}</span>. Trailing stop hit prematurely due to high volatility cluster.
                                        </p>
                                    </div>
                                    <div className="rounded-2xl bg-red-500/5 border border-red-500/10 p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Brain className="h-4 w-4 text-red-500" />
                                            <span className="text-xs font-bold text-red-400 uppercase tracking-tighter">AI Feedback</span>
                                        </div>
                                        <p className="text-sm text-zinc-300 font-medium leading-relaxed">
                                            Recommend widening ATR multiplier by 0.5x during New York session overlap for {trade.symbol}.
                                        </p>
                                    </div>
                                </div>

                                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="p-2 rounded-xl bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all">
                                        <ArrowRight className="h-5 w-5" />
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

                <div className="space-y-6">
                    <div className="rounded-3xl border border-white/5 bg-zinc-900/40 p-8 backdrop-blur-md">
                        <h3 className="text-lg font-bold text-white mb-6">Error Distribution</h3>
                        <div className="space-y-6">
                            {[
                                { name: "Volatility Squeeze", value: 45, color: "bg-orange-500" },
                                { name: "Network Lag", value: 12, color: "bg-blue-500" },
                                { name: "AI Miscalc", value: 28, color: "bg-purple-500" },
                                { name: "Other", value: 15, color: "bg-zinc-700" },
                            ].map((item) => (
                                <div key={item.name} className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                                        <span className="text-zinc-500">{item.name}</span>
                                        <span className="text-white">{item.value}%</span>
                                    </div>
                                    <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${item.value}%` }}
                                            className={cn("h-full", item.color)} 
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-3xl bg-gradient-to-br from-orange-500 to-orange-600 p-8 shadow-xl shadow-orange-500/10">
                        <h3 className="text-lg font-bold text-white mb-2">Retrain Agent</h3>
                        <p className="text-sm text-orange-100 mb-6 font-medium leading-relaxed tracking-tight"> Feed the current mistakes log back into the Llama-3 cluster to improve next session logic.</p>
                        <button className="w-full rounded-2xl bg-white py-3.5 text-sm font-bold text-orange-600 hover:bg-orange-50 transition-all shadow-lg active:scale-95">
                            Synthesize Learning
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
