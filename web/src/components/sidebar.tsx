"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
    LayoutDashboard, 
    History, 
    AlertTriangle, 
    Settings, 
    Activity,
    ChevronRight,
    Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const navigation = [
    { name: "Overview", href: "/", icon: LayoutDashboard },
    { name: "History", href: "/history", icon: History },
    { name: "Mistakes", href: "/mistakes", icon: AlertTriangle },
    { name: "Signals", href: "/signals", icon: Activity },
    { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex h-full w-72 flex-col border-r border-white/5 bg-zinc-950/50 backdrop-blur-xl">
            <div className="flex h-20 items-center px-8">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20">
                        <Activity className="h-6 w-6 text-orange-500" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-white">
                        Bot<span className="text-orange-500">Binance</span>
                    </span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8">
                <div>
                    <div className="px-4 mb-4">
                        <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                            Menu
                        </span>
                    </div>
                    <nav className="space-y-1">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={cn(
                                        "group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                                        isActive 
                                            ? "bg-white/5 text-white" 
                                            : "text-zinc-400 hover:bg-white/5 hover:text-white"
                                    )}
                                >
                                    <item.icon className={cn(
                                        "h-5 w-5 transition-colors",
                                        isActive ? "text-orange-500" : "text-zinc-500 group-hover:text-zinc-300"
                                    )} />
                                    {item.name}
                                    
                                    {isActive && (
                                        <motion.div 
                                            layoutId="active-indicator"
                                            className="absolute left-0 h-6 w-1 rounded-r-full bg-orange-500"
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                    
                                    <ChevronRight className={cn(
                                        "ml-auto h-4 w-4 opacity-0 transition-all",
                                        !isActive && "group-hover:opacity-100 group-hover:translate-x-1"
                                    )} />
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div>
                    <div className="px-4 mb-4">
                        <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                            Search
                        </span>
                    </div>
                    <div className="px-2">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 group-focus-within:text-orange-500 transition-colors" />
                            <input 
                                type="text"
                                placeholder="Find trade..."
                                className="w-full rounded-xl bg-white/5 border border-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-all"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6">
                <div className="rounded-2xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20 p-5">
                    <p className="text-sm font-semibold text-white mb-1">Execution Core</p>
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs text-zinc-400">Trading Live</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
