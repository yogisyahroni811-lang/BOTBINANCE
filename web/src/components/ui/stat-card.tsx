"use client";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface StatCardProps {
    title: string;
    value: string | number;
    description: string;
    icon: LucideIcon;
    trend?: {
        value: string;
        positive: boolean;
    };
    loading?: boolean;
}

export function StatCard({ 
    title, 
    value, 
    description, 
    icon: Icon, 
    trend,
    loading 
}: StatCardProps) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            className="group relative overflow-hidden rounded-3xl border border-white/5 bg-zinc-900/40 p-6 backdrop-blur-md transition-all hover:border-orange-500/20 hover:bg-zinc-900/60"
        >
            {/* Background Glow */}
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-orange-500/5 blur-3xl group-hover:bg-orange-500/10 transition-colors" />

            <div className="flex items-center justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/5 text-orange-500 group-hover:scale-110 transition-transform">
                    <Icon className="h-6 w-6" />
                </div>
                
                {trend && (
                    <div className={cn(
                        "flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                        trend.positive 
                            ? "bg-green-500/10 text-green-500 border border-green-500/20" 
                            : "bg-red-500/10 text-red-500 border border-red-500/20"
                    )}>
                        {trend.positive ? "▲" : "▼"} {trend.value}
                    </div>
                )}
            </div>

            <div className="space-y-1">
                <p className="text-sm font-medium text-zinc-500 uppercase tracking-wider">{title}</p>
                {loading ? (
                    <div className="h-9 w-32 animate-pulse rounded-lg bg-white/5" />
                ) : (
                    <h3 className="text-3xl font-bold tracking-tight text-white">{value}</h3>
                )}
                <p className="text-xs text-zinc-600 font-medium">{description}</p>
            </div>
            
            {/* Animated Bottom Border */}
            <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-500 group-hover:w-full" />
        </motion.div>
    );
}
