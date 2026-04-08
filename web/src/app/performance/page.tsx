"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    Tooltip, 
    ResponsiveContainer, 
    BarChart, 
    Bar, 
    Cell,
    CartesianGrid,
    AreaChart,
    Area
} from "recharts";
import { 
    TrendingUp, 
    LineChart as ChartIcon, 
    Zap, 
    Target,
    ArrowUpRight,
    ArrowDownRight
} from "lucide-react";

export default function PerformancePage() {
    const { data: history, isLoading } = useQuery({
        queryKey: ["performance-history"],
        queryFn: () => api.getPerformanceHistory(),
    });

    const stats = [
        { label: "Total Profit", value: "+$12,450.20", trend: "+12.4%", icon: TrendingUp, color: "text-green-500" },
        { label: "Avg. Daily PnL", value: "+$420.15", trend: "+5.2%", icon: Zap, color: "text-orange-500" },
        { label: "Profit Factor", value: "2.14", trend: "Stable", icon: Target, color: "text-blue-500" },
        { label: "Max Drawdown", value: "-4.20%", trend: "-0.5%", icon: ChartIcon, color: "text-red-500" },
    ];

    if (isLoading) return <div className="p-8 animate-pulse space-y-8">
        <div className="h-48 bg-white/5 rounded-3xl" />
        <div className="grid grid-cols-4 gap-6">
            {[1,2,3,4].map(i => <div key={i} className="h-32 bg-white/5 rounded-2xl" />)}
        </div>
    </div>;

    return (
        <div className="space-y-8 pb-12">
            <div>
                <h1 className="text-4xl font-black tracking-tight text-white mb-2 italic">PERFORMANCE ANALYTICS</h1>
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Algorithmic execution metrics & Equity growth</p>
            </div>

            {/* Main Equity Curve */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl border border-white/5 bg-zinc-900/40 p-8 backdrop-blur-md relative overflow-hidden"
            >
                <div className="flex justify-between items-start mb-8 relative z-10">
                    <div>
                        <h3 className="text-lg font-bold text-white uppercase tracking-tight">Equity Growth</h3>
                        <p className="text-sm text-zinc-500">Cumulative performance over the last 30 days</p>
                    </div>
                    <div className="flex gap-2">
                        <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 text-[10px] font-black border border-orange-500/20">ALL TIME HIGH</span>
                    </div>
                </div>

                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={history}>
                            <defs>
                                <linearGradient id="colorPnL" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                            <XAxis 
                                dataKey="date" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#71717a', fontSize: 10, fontWeight: 'bold' }}
                                dy={10}
                            />
                            <YAxis 
                                hide 
                                domain={['dataMin - 100', 'dataMax + 100']}
                            />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                                itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="total_pnl" 
                                stroke="#f97316" 
                                strokeWidth={3}
                                fillOpacity={1} 
                                fill="url(#colorPnL)" 
                                animationDuration={2000}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="rounded-2xl border border-white/5 bg-zinc-900/40 p-6 backdrop-blur-md"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-2 rounded-lg bg-zinc-800/50 ${stat.color}`}>
                                <stat.icon size={20} />
                            </div>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${stat.trend.startsWith('+') ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                {stat.trend}
                            </span>
                        </div>
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">{stat.label}</p>
                        <p className="text-2xl font-black text-white">{stat.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Secondary Charts Block */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Win Rate Analysis */}
                <div className="rounded-3xl border border-white/5 bg-zinc-900/40 p-8 backdrop-blur-md">
                    <h3 className="text-lg font-bold text-white uppercase tracking-tight mb-6">Win Rate Distribution</h3>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={history}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                <XAxis dataKey="date" hide />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 10 }} />
                                <Bar dataKey="win_rate" radius={[4, 4, 0, 0]}>
                                    {history?.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.win_rate > 50 ? "#10b981" : "#ef4444"} fillOpacity={0.6} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Daily PnL Volatility */}
                <div className="rounded-3xl border border-white/5 bg-zinc-900/40 p-8 backdrop-blur-md">
                    <h3 className="text-lg font-bold text-white uppercase tracking-tight mb-6">Daily PnL Volatility</h3>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={history}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                <XAxis dataKey="date" hide />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 10 }} />
                                <Tooltip />
                                <Line type="monotone" dataKey="total_pnl" stroke="#f97316" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
