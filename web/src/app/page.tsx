"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { StatCard } from "@/components/ui/stat-card";
import { 
    TrendingUp, 
    Layers, 
    Percent, 
    Wallet,
    Power,
    ShieldCheck,
    FlaskConical
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { WatchlistPanel } from "@/components/dashboard/watchlist-panel";
import { MainChart } from "@/components/dashboard/main-chart";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function Dashboard() {
    const queryClient = useQueryClient();

    const { data: settings } = useQuery({
        queryKey: ["settings"],
        queryFn: () => api.getSettings(),
    });

    const isLive = settings?.find(s => s.key === "is_live_trading")?.value === "true";

    const toggleMode = useMutation({
        mutationFn: (newVal: boolean) => api.updateSetting("is_live_trading", newVal ? "true" : "false"),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["settings"] });
            toast.success(isLive ? "Live Trading Disabled" : "Live Trading Activated");
        },
    });

    const { data: perf, isLoading: perfLoading } = useQuery({
        queryKey: ["performance", isLive],
        queryFn: () => api.getPerformance(undefined, !isLive),
        refetchInterval: 5000,
    });

    const { data: positions, isLoading: posLoading } = useQuery({
        queryKey: ["positions", isLive],
        queryFn: () => api.getPositions(!isLive),
        refetchInterval: 5000,
    });

    return (
        <div className="space-y-8 pb-12 overflow-hidden">
            {/* Header Section */}
            <div className="flex items-end justify-between">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-4xl font-bold tracking-tight text-white">Portfolio Overview</h1>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={isLive ? "live" : "paper"}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                    isLive 
                                        ? "bg-green-500/10 text-green-500 border-green-500/20" 
                                        : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                )}
                            >
                                {isLive ? (
                                    <><ShieldCheck className="h-3 w-3" /> Live Trading</>
                                ) : (
                                    <><FlaskConical className="h-3 w-3" /> Paper Session</>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                    <p className="text-zinc-500 font-medium">Monitoring execution across active clusters.</p>
                </motion.div>
                
                <div className="flex items-center gap-6">
                    {/* Live Toggle */}
                    <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/5 border border-white/5">
                        <span className="text-xs font-bold text-zinc-400">Execution Mode</span>
                        <button 
                            onClick={() => toggleMode.mutate(!isLive)}
                            className={cn(
                                "relative w-12 h-6 rounded-full transition-all duration-300 p-1",
                                isLive ? "bg-green-500" : "bg-zinc-700"
                            )}
                        >
                            <motion.div 
                                animate={{ x: isLive ? 24 : 0 }}
                                className="h-4 w-4 rounded-full bg-white shadow-lg"
                            />
                        </button>
                    </div>

                    <div className="flex gap-2">
                        <button className="rounded-xl px-4 py-2 text-sm font-semibold bg-white/5 border border-white/5 text-zinc-400 hover:text-white transition-colors">
                            Day
                        </button>
                        <button className="rounded-xl px-4 py-2 text-sm font-semibold bg-orange-500 text-white shadow-lg shadow-orange-500/20">
                            Week
                        </button>
                        <button className="rounded-xl px-4 py-2 text-sm font-semibold bg-white/5 border border-white/5 text-zinc-400 hover:text-white transition-colors">
                            Month
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Total PnL"
                    value={`+$${perf?.total_pnl?.toFixed(2) || "0.00"}`}
                    description="Live aggregated profit/loss"
                    icon={TrendingUp}
                    trend={{ value: "12.5%", positive: true }}
                    loading={perfLoading}
                />
                <StatCard 
                    title="Active Positions"
                    value={perf?.open_positions || 0}
                    description="Currently monitoring orders"
                    icon={Layers}
                    loading={perfLoading}
                />
                <StatCard 
                    title="Win Rate"
                    value={`${perf?.win_rate?.toFixed(1) || "0.0"}%`}
                    description="Algorithm success probability"
                    icon={Percent}
                    trend={{ value: "2.1%", positive: true }}
                    loading={perfLoading}
                />
                <StatCard 
                    title="Execution Wallet"
                    value="$12,450.00"
                    description="Available USDT balance"
                    icon={Wallet}
                    loading={false}
                />
            </div>

            {/* Trading Core Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[600px]">
                {/* Watchlist - Left 3 cols */}
                <div className="lg:col-span-3 h-full overflow-hidden">
                    <WatchlistPanel />
                </div>

                {/* Main Chart - Center 6 cols */}
                <div className="lg:col-span-6 h-full space-y-6 overflow-hidden">
                    <MainChart symbol="BTCUSDT" />
                    
                    {/* Position Summary Mini-Card */}
                    <div className="rounded-2xl border border-white/5 bg-zinc-900/40 p-5 backdrop-blur-md">
                        <div className="flex items-center justify-between">
                            <div className="flex gap-8">
                                <div>
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Leverage</p>
                                    <p className="text-sm font-bold text-white">Isolated 10x</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Risk per Trade</p>
                                    <p className="text-sm font-bold text-white">2.5%</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Max Drawdown</p>
                                    <p className="text-sm font-bold text-red-500">-4.20%</p>
                                </div>
                            </div>
                            <button className="px-4 py-2 rounded-xl bg-white/5 text-xs font-bold text-zinc-400 hover:text-white transition-all">
                                Adjust Limits
                            </button>
                        </div>
                    </div>
                </div>

                {/* Live Positions - Right 3 cols */}
                <div className="lg:col-span-3 h-full overflow-hidden rounded-3xl border border-white/5 bg-zinc-900/40 backdrop-blur-md flex flex-col">
                    <div className="p-6 border-b border-white/5">
                        <h3 className="text-lg font-bold text-white">Live Positions</h3>
                        <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest font-semibold">{positions?.length || 0} ACTIVE TRADES</p>
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y divide-white/5 scrollbar-hide">
                        {posLoading ? (
                             [1,2,3].map(i => <div key={i} className="h-20 w-full animate-pulse rounded-xl bg-white/5 m-4" />)
                        ) : positions?.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full p-8 text-center opacity-30">
                                <Layers className="h-10 w-10 mb-4" />
                                <p className="text-sm font-medium">No active executions</p>
                            </div>
                        ) : (
                            positions?.map((pos) => (
                                <div key={pos.id} className="p-5 hover:bg-white/[0.02] transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="text-sm font-black text-white">{pos.symbol}</p>
                                            <p className={cn("text-[10px] font-black uppercase tracking-widest", pos.side === "LONG" ? "text-green-500" : "text-red-500")}>
                                                {pos.side} {pos.size} units
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-white">${pos.entry_price.toFixed(2)}</p>
                                            <p className="text-[10px] text-zinc-500 uppercase font-semibold">Entry</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-3">
                                        <div className="h-1.5 w-24 rounded-full bg-white/5 overflow-hidden">
                                            <div className="h-full w-[65%] bg-orange-500" />
                                        </div>
                                        <span className="text-xs font-black text-green-500">+1.42%</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
