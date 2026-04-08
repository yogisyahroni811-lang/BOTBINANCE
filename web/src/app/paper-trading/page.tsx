"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { StatCard } from "@/components/ui/stat-card";
import { CapitalModal } from "@/components/ui/capital-modal";
import { 
    FlaskConical, 
    Layers, 
    Percent, 
    History as HistoryIcon,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    ShieldCheck,
    Settings2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function PaperTrading() {
    const queryClient = useQueryClient();
    const [isModalOpen, setModalOpen] = useState(false);

    const { data: settings } = useQuery({
        queryKey: ["settings"],
        queryFn: () => api.getSettings(),
    });

    const isLive = settings?.find(s => s.key === "is_live_trading")?.value === "true";
    const paperBalance = settings?.find(s => s.key === "paper_balance")?.value || "100000.00";

    const toggleMode = useMutation({
        mutationFn: (newVal: boolean) => api.updateSetting("is_live_trading", newVal ? "true" : "false"),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["settings"] });
            toast.success(isLive ? "Live Trading Disabled" : "Live Trading Activated");
        },
    });

    const updateBalance = useMutation({
        mutationFn: (newBalance: string) => api.updateSetting("paper_balance", newBalance),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["settings"] });
            toast.success("Virtual balance updated successfully");
        },
    });

    const handleSetCapital = () => {
        setModalOpen(true);
    };

    const handleConfirmCapital = async (data: { amount: number; mode: "SET" | "ADD" }) => {
        let newTotal: number;
        
        if (data.mode === "ADD") {
            newTotal = parseFloat(paperBalance) + data.amount;
        } else {
            newTotal = data.amount;
        }

        await updateBalance.mutateAsync(newTotal.toFixed(2));
    };

    // We always pass isPaper=true to these queries for this page
    const { data: perf, isLoading: perfLoading } = useQuery({
        queryKey: ["performance", "paper"],
        queryFn: () => api.getPerformance(undefined, true),
        refetchInterval: 5000,
    });

    const initialCapital = parseFloat(paperBalance) || 10000;
    const totalPnl = perf?.total_pnl || 0;
    const currentEquity = initialCapital + totalPnl;
    const growthRate = (totalPnl / initialCapital) * 100;

    const { data: positions, isLoading: posLoading } = useQuery({
        queryKey: ["positions", "paper"],
        queryFn: () => api.getPositions(true),
        refetchInterval: 5000,
    });

    const { data: history, isLoading: historyLoading } = useQuery({
        queryKey: ["trades", "paper"],
        queryFn: () => api.getTrades(20, 0, true),
        refetchInterval: 10000,
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
                        <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                            <FlaskConical className="h-6 w-6 text-blue-500" />
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight text-white">Paper Trading</h1>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={isLive ? "live" : "paper"}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors",
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
                    <p className="text-zinc-500 font-medium">Risk-free simulation environment using real-time market data.</p>
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

                    <div className="flex bg-white/5 border border-white/5 rounded-2xl p-1">
                        <button className="px-4 py-2 rounded-xl text-sm font-bold bg-blue-500 text-white shadow-lg shadow-blue-500/20">
                            Overview
                        </button>
                        <button className="px-4 py-2 rounded-xl text-sm font-bold text-zinc-400 hover:text-white transition-all">
                            Analytics
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Simulated PnL"
                    value={`${totalPnl >= 0 ? "+" : ""}$${totalPnl.toFixed(2)}`}
                    description="Paper profit/loss (all-time)"
                    icon={FlaskConical}
                    trend={{ 
                        value: `${growthRate >= 0 ? "+" : ""}${growthRate.toFixed(2)}%`, 
                        positive: growthRate >= 0 
                    }}
                    loading={perfLoading}
                />
                <StatCard 
                    title="Active Positions"
                    value={perf?.open_positions || 0}
                    description="Simulated orders"
                    icon={Layers}
                    loading={perfLoading}
                />
                <StatCard 
                    title="Win Rate"
                    value={`${perf?.win_rate?.toFixed(1) || "0.0"}%`}
                    description="Paper success rate"
                    icon={Percent}
                    loading={perfLoading}
                />
                <StatCard 
                    title="Virtual Balance"
                    value={`$${currentEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    description={`Initial: $${initialCapital.toLocaleString()}`}
                    icon={HistoryIcon}
                    loading={false}
                    action={{
                        label: "Adjust Capital",
                        icon: Settings2,
                        onClick: handleSetCapital
                    }}
                />
            </div>

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Active Positions Table - Left 7 cols */}
                <div className="lg:col-span-12 xl:col-span-7 space-y-6">
                    <div className="rounded-3xl border border-white/5 bg-zinc-900/40 backdrop-blur-md overflow-hidden">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-white">Active Paper Positions</h3>
                                <p className="text-xs text-zinc-500 mt-0.5 uppercase tracking-widest font-semibold">Real-time simulation</p>
                            </div>
                            <div className="flex gap-2">
                                <button className="p-2 rounded-xl bg-white/5 text-zinc-400 hover:text-white transition-colors">
                                    <Search className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-white/[0.02] text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                    <tr>
                                        <th className="px-6 py-4">Symbol</th>
                                        <th className="px-6 py-4">Side</th>
                                        <th className="px-6 py-4">Entry</th>
                                        <th className="px-6 py-4">Size</th>
                                        <th className="px-6 py-4 text-right">PnL</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {posLoading ? (
                                        [1,2,3].map(i => (
                                            <tr key={i} className="animate-pulse">
                                                <td colSpan={5} className="px-6 py-8"><div className="h-4 w-full bg-white/5 rounded" /></td>
                                            </tr>
                                        ))
                                    ) : positions?.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 text-sm italic">
                                                No active paper positions.
                                            </td>
                                        </tr>
                                    ) : (
                                        positions?.map((pos) => (
                                            <tr key={pos.id} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-6 py-4 font-black text-white">{pos.symbol}</td>
                                                <td className="px-6 py-4">
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest",
                                                        pos.side === "LONG" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                                                    )}>
                                                        {pos.side}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-medium text-zinc-300">${pos.entry_price.toFixed(2)}</td>
                                                <td className="px-6 py-4 font-medium text-zinc-300">{pos.size}</td>
                                                <td className="px-6 py-4 text-right font-black text-green-500">+1.25%</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Recent History - Right 5 cols */}
                <div className="lg:col-span-12 xl:col-span-5">
                    <div className="rounded-3xl border border-white/5 bg-zinc-900/40 backdrop-blur-md overflow-hidden h-full flex flex-col">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-white">Simulation History</h3>
                                <p className="text-xs text-zinc-500 mt-0.5 uppercase tracking-widest font-semibold">Latest exits</p>
                            </div>
                            <HistoryIcon className="h-5 w-5 text-zinc-500" />
                        </div>

                        <div className="flex-1 overflow-y-auto divide-y divide-white/5">
                            {historyLoading ? (
                                [1,2,3,4].map(i => <div key={i} className="h-20 w-full animate-pulse bg-white/5" />)
                            ) : history?.length === 0 ? (
                                <div className="p-8 text-center text-zinc-500 text-sm">No simulation history yet.</div>
                            ) : (
                                history?.map((trade) => (
                                    <div key={trade.id} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "p-2 rounded-xl",
                                                trade.pnl > 0 ? "bg-green-500/10" : "bg-red-500/10"
                                            )}>
                                                {trade.pnl > 0 ? (
                                                    <ArrowUpRight className={cn("h-5 w-5", trade.pnl > 0 ? "text-green-500" : "text-red-500")} />
                                                ) : (
                                                    <ArrowDownRight className={cn("h-5 w-5 text-red-500")} />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-black text-white">{trade.symbol}</p>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                                    {trade.side} • ${trade.entry_price.toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={cn("font-black", trade.pnl > 0 ? "text-green-500" : "text-red-500")}>
                                                {trade.pnl > 0 ? "+" : ""}${trade.pnl.toFixed(2)}
                                            </p>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">PnL</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <CapitalModal 
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                currentBalance={paperBalance}
                onConfirm={handleConfirmCapital}
            />
        </div>
    );
}
