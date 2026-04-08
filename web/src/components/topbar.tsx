"use client";

import { 
    Bell, 
    CircleStop, 
    Cpu, 
    Wifi, 
    User,
    Command
} from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";

export function TopBar() {
    const emergencyMutation = useMutation({
        mutationFn: () => api.triggerEmergency(),
        onSuccess: () => {
             // We would normally fire a toast here
             alert("EMERGENCY STOP TRIGGERED");
        }
    });

    return (
        <header className="flex h-20 items-center justify-between border-b border-white/5 bg-zinc-950/30 px-8 backdrop-blur-md">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
                    <Command className="h-4 w-4 text-zinc-500" />
                    <span className="text-xs font-medium text-zinc-400">Terminal v2.4.0</span>
                </div>

                <div className="flex items-center gap-4 text-xs font-medium">
                    <div className="flex items-center gap-2 text-green-500">
                        <Wifi className="h-4 w-4" />
                        <span>Binance Connected</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-500">
                        <Cpu className="h-4 w-4" />
                        <span>Latency: 24ms</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button 
                    onClick={() => emergencyMutation.mutate()}
                    disabled={emergencyMutation.isPending}
                    className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-500 hover:text-white transition-all duration-200 active:scale-95"
                >
                    <CircleStop className="h-4 w-4" />
                    {emergencyMutation.isPending ? "Stopping..." : "Emergency Stop"}
                </button>

                <div className="h-6 w-px bg-white/10 mx-2" />

                <div className="flex gap-2">
                    <button className="relative p-2.5 rounded-xl text-zinc-400 hover:bg-white/5 hover:text-white transition-all">
                        <Bell className="h-5 w-5" />
                        <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-orange-500 border-2 border-zinc-950" />
                    </button>
                    
                    <button className="flex items-center gap-3 p-1.5 pl-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                        <div className="flex flex-col items-end">
                            <span className="text-xs font-bold text-white leading-none">Trader.One</span>
                            <span className="text-[10px] text-zinc-500 leading-none mt-1 uppercase">Pro Tier</span>
                        </div>
                        <div className="h-8 w-8 rounded-lg bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
                            <User className="h-4 w-4 text-orange-500" />
                        </div>
                    </button>
                </div>
            </div>
        </header>
    );
}
