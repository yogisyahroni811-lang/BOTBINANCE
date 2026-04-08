"use client";

import { motion } from "framer-motion";
import { Activity, AlertTriangle, TrendingUp, BarChart3, Database } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MainChart } from "@/components/dashboard/MainChart";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function DashboardPage() {
  return (
    <div className="min-h-screen p-6 md:p-12 max-w-7xl mx-auto space-y-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            BotBinance Command Center
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Real-time algorithmic trading oversight & AI mistake analysis.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="px-4 py-2 text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            System Online
          </Badge>
          <Button variant="outline" className="border-primary/20 hover:bg-primary/10">
            <Database className="w-4 h-4 mr-2" /> Sync Data
          </Button>
        </div>
      </header>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <motion.div variants={item}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Trades</CardTitle>
              <Activity className="w-4 h-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">12</div>
              <p className="text-xs text-muted-foreground mt-1">+2 since last hour</p>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={item}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Win Rate (24h)</CardTitle>
              <TrendingUp className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">68.5%</div>
              <p className="text-xs text-emerald-500 mt-1 flex items-center">
                ↑ +4.2% from yesterday
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">AI Mistake Detections</CardTitle>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">3</div>
              <p className="text-xs text-muted-foreground mt-1">Requires review</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total PnL</CardTitle>
              <BarChart3 className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-500">+$1,240.50</div>
              <p className="text-xs text-muted-foreground mt-1">Current session</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full"
      >
        <MainChart />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Mistake Analyzer Insights</CardTitle>
              <CardDescription>RAG-powered analysis from recent pattern failures.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { 
                  id: "TR-902", 
                  category: "WRONG_WAVE_COUNT", 
                  desc: "Elliott Wave count was incorrectly labelled as an impulse instead of a correction.",
                  time: "2 hours ago",
                  impact: "High"
                },
                { 
                  id: "TR-884", 
                  category: "LATE_ENTRY", 
                  desc: "Entered Zone C after it had been tested 3 times previously. Probability was lowered.",
                  time: "5 hours ago",
                  impact: "Medium"
                }
              ].map((mistake) => (
                <div key={mistake.id} className="group p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <Badge variant="destructive" className="font-mono">{mistake.id}</Badge>
                      <span className="text-sm font-semibold text-rose-400">{mistake.category}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{mistake.time}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {mistake.desc}
                  </p>
                  <div className="mt-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="secondary">View Chart</Button>
                    <Button size="sm" variant="outline">Acknowledge</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle>System Architecture</CardTitle>
              <CardDescription>Real-time orchestrator status.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2 relative">
                <div className="absolute left-[11px] top-8 bottom-4 w-px bg-border/50" />
                
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium">Core Rust Engine</h4>
                    <p className="text-xs text-muted-foreground">Market Ticker Syncing</p>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>

                <div className="flex items-center gap-4 relative z-10 pt-4">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium">Python AI Service</h4>
                    <p className="text-xs text-muted-foreground">RAG Vector DB Connected</p>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>

                <div className="flex items-center gap-4 relative z-10 pt-4">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium">Supabase Database</h4>
                    <p className="text-xs text-muted-foreground">Realtime listening...</p>
                  </div>
                  <Badge variant="outline">Idle</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
