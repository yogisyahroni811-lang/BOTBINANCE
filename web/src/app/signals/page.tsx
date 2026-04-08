"use client";

import { useQuery } from "@tanstack/react-query";
import { api, SignalResponse, SndZone, ElliottWave } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Activity, 
    TrendingUp, 
    TrendingDown, 
    ShieldCheck, 
    Zap, 
    Target,
    BarChart3,
    ArrowUpRight,
    Search,
    Filter
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SignalsPage() {
    const { data: signals, isLoading } = useQuery({
        queryKey: ["signals"],
        queryFn: () => api.getSignals(),
        refetchInterval: 30000, // Refetch every 30 seconds
    });

    if (isLoading) return (
        <div className="p-8 space-y-8 animate-pulse">
            <div className="h-12 w-64 bg-white/5 rounded-lg" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="h-96 bg-white/5 rounded-3xl" />
                <div className="h-96 bg-white/5 rounded-3xl" />
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-orange-500/20 border border-orange-500/20">
                            <Activity className="h-5 w-5 text-orange-500" />
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-white italic uppercase">ACTIVE SIGNALS</h1>
                    </div>
                    <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                        Neural Analysis Engine Live
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-orange-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Search symbols..."
                            className="bg-white/5 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-all w-48 md:w-64"
                        />
                    </div>
                    <button className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all">
                        <Filter className="h-5 w-5" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Supply & Demand Zones */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black text-white italic uppercase flex items-center gap-2">
                            <ShieldCheck className="text-orange-500" size={20} />
                            S&D Zones
                        </h2>
                        <span className="px-2 py-1 rounded bg-zinc-800 text-[10px] font-black text-zinc-400 uppercase tracking-tighter">
                            {signals?.snd_zones.length || 0} Detected
                        </span>
                    </div>

                    <div className="grid gap-4">
                        <AnimatePresence mode="popLayout">
                            {signals?.snd_zones.map((signal, index) => (
                                <ZoneCard 
                                    key={`snd-${signal.data.id}`}
                                    signal={signal} 
                                    index={index}
                                />
                            ))}
                        </AnimatePresence>
                        {(!signals?.snd_zones || signals.snd_zones.length === 0) && (
                            <EmptyState message="No active S&D zones detected." />
                        )}
                    </div>
                </section>

                {/* Elliott Wave Analysis */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black text-white italic uppercase flex items-center gap-2">
                            <Zap className="text-orange-500" size={20} />
                            Elliott Waves
                        </h2>
                        <span className="px-2 py-1 rounded bg-zinc-800 text-[10px] font-black text-zinc-400 uppercase tracking-tighter">
                            {signals?.elliott_waves.length || 0} Patterns
                        </span>
                    </div>

                    <div className="grid gap-4">
                        <AnimatePresence mode="popLayout">
                            {signals?.elliott_waves.map((signal, index) => (
                                <WaveCard 
                                    key={`ew-${signal.data.id}`}
                                    signal={signal} 
                                    index={index}
                                />
                            ))}
                        </AnimatePresence>
                        {(!signals?.elliott_waves || signals.elliott_waves.length === 0) && (
                            <EmptyState message="Searching for wave structures..." />
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}

function ZoneCard({ signal, index }: { signal: any, index: number }) {
    const isDemand = signal.data.zone_type === "DEMAND";
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group relative overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/40 p-5 hover:border-orange-500/20 hover:bg-zinc-800/40 transition-all duration-300"
        >
            <div className="flex justify-between items-start relative z-10">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "h-10 w-10 flex items-center justify-center rounded-xl font-black text-xs",
                        isDemand ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
                    )}>
                        {signal.data.timeframe}
                    </div>
                    <div>
                        <h4 className="text-lg font-black text-white tracking-tight">{signal.symbol}</h4>
                        <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest",
                            isDemand ? "text-green-500/60" : "text-red-500/60"
                        )}>
                            {signal.data.zone_type} ZONE
                        </span>
                    </div>
                </div>

                <div className="text-right">
                    <div className="text-sm font-black text-white">${signal.data.price_high}</div>
                    <div className="text-[10px] font-bold text-zinc-500 italic">Target Range</div>
                </div>
            </div>

            <div className="mt-6 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                    <div className="space-y-0.5">
                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-tighter">Zone Quality</p>
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-zinc-300">GRADE {signal.data.grade}</span>
                            <div className="flex gap-0.5">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className={cn(
                                        "h-1 w-3 rounded-full",
                                        i < (signal.data.grade === 'A' ? 3 : signal.data.grade === 'B' ? 2 : 1) 
                                        ? (isDemand ? "bg-green-500" : "bg-red-500") 
                                        : "bg-zinc-800"
                                    )} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <button className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-[10px] font-black text-white hover:bg-orange-500 hover:border-orange-600 transition-all uppercase italic">
                    Inspect <ArrowUpRight size={12} />
                </button>
            </div>

            {/* Background decoration */}
            <div className={cn(
                "absolute -right-4 -bottom-4 opacity-[0.03] transition-transform group-hover:scale-110 duration-500",
                isDemand ? "text-green-500" : "text-red-500"
            )}>
                {isDemand ? <TrendingUp size={120} /> : <TrendingDown size={120} />}
            </div>
        </motion.div>
    );
}

function WaveCard({ signal, index }: { signal: any, index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group relative overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/40 p-5 hover:border-orange-500/20 hover:bg-zinc-800/40 transition-all duration-300"
        >
            <div className="flex justify-between items-start relative z-10">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20 font-black text-xs">
                        {signal.data.timeframe}
                    </div>
                    <div>
                        <h4 className="text-lg font-black text-white tracking-tight">{signal.symbol}</h4>
                        <span className="text-[10px] font-black uppercase tracking-widest text-orange-500/60">
                            WAVE {signal.data.current_wave} ({signal.data.wave_type})
                        </span>
                    </div>
                </div>

                <div className="text-right">
                    <div className="text-sm font-black text-white">{Math.round(signal.data.confidence)}%</div>
                    <div className="text-[10px] font-bold text-zinc-500 italic">Confidence</div>
                </div>
            </div>

            <div className="mt-6 flex items-end justify-between relative z-10">
                <div className="space-y-3 flex-1">
                    <div className="flex justify-between items-center pr-10">
                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-tighter">Structural Integrity</p>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-800/50 rounded-full overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${signal.data.confidence}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className="h-full bg-gradient-to-r from-orange-600 to-orange-400" 
                        />
                    </div>
                </div>

                <div className="pl-6">
                     <button className="flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-1.5 text-[10px] font-black text-zinc-300 hover:text-white transition-colors uppercase italic">
                        View Chart
                    </button>
                </div>
            </div>

            <div className="absolute -right-4 -bottom-4 opacity-[0.03] transition-transform group-hover:scale-110 duration-500 text-orange-500">
                <BarChart3 size={120} />
            </div>
        </motion.div>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="py-20 text-center rounded-3xl border border-dashed border-white/5 bg-white/[0.02]">
            <Target className="mx-auto text-zinc-800 mb-4" size={48} />
            <p className="text-zinc-600 font-black italic uppercase tracking-widest">{message}</p>
        </div>
    );
}
