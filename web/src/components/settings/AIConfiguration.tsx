"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Check, 
  Search, 
  Plus, 
  Cpu, 
  Globe, 
  Lock, 
  Eye, 
  EyeOff, 
  Trash2,
  ExternalLink,
  ChevronRight,
  Info,
  ShieldCheck,
  Zap
} from "lucide-react";
import { AI_PROVIDERS, AIProvider, AIModel } from "@/lib/ai-constants";
import { cn } from "@/lib/api";

interface AIConfigurationProps {
  settings: any[];
  onUpdate: (key: string, value: string) => void;
  isSaving: boolean;
}

export function AIConfiguration({ settings, onUpdate, isSaving }: AIConfigurationProps) {
  const [search, setSearch] = useState("");
  const [showKey, setShowKey] = useState(false);
  
  // Get current values from settings
  const activeProviderId = settings.find(s => s.key === "ai_active_provider")?.value || "google";
  const activeModelId = settings.find(s => s.key === "ai_active_model")?.value || "";
  const apiKey = settings.find(s => s.key === "ai_api_key")?.value || "";
  const baseUrl = settings.find(s => s.key === "ai_base_url")?.value || "";
  const temperature = parseFloat(settings.find(s => s.key === "ai_temperature")?.value || "0.1");
  const maxTokens = parseInt(settings.find(s => s.key === "ai_max_tokens")?.value || "8192");
  
  // New Risk Settings
  const maxOpenPositions = parseInt(settings.find(s => s.key === "risk_max_open_positions")?.value || "3");
  const riskPerTrade = parseFloat(settings.find(s => s.key === "risk_per_trade_pct")?.value || "1.0");
  const riskReversalEnabled = settings.find(s => s.key === "risk_reversal_enabled")?.value === "true";
  const beBuffer = settings.find(s => s.key === "risk_be_buffer_pct")?.value || "0.05";
  
  const customModelsRaw = settings.find(s => s.key === "ai_custom_models")?.value || "[]";
  const customModels: string[] = useMemo(() => {
    try { return JSON.parse(customModelsRaw); } catch { return []; }
  }, [customModelsRaw]);

  const activeProvider = AI_PROVIDERS.find(p => p.id === activeProviderId) || AI_PROVIDERS[0];

  const filteredModels = useMemo(() => {
    const providerModels = activeProvider.models;
    const combined: AIModel[] = [
      ...providerModels,
      ...customModels.map(id => ({ id, name: id, description: "Custom User Model" }))
    ];
    return combined.filter(m => 
      m.name.toLowerCase().includes(search.toLowerCase()) || 
      m.id.toLowerCase().includes(search.toLowerCase())
    );
  }, [activeProvider, customModels, search]);

  const handleSaveModel = (id: string) => {
    onUpdate("ai_active_model", id);
  };

  const handleAddCustomModel = () => {
    const modelId = prompt("Enter Custom Model ID (e.g. gpt-5-preview):");
    if (modelId) {
      const updated = [...customModels, modelId];
      onUpdate("ai_custom_models", JSON.stringify(updated));
      onUpdate("ai_active_model", modelId);
    }
  };

  return (
    <div className="space-y-10">
      {/* Provider Selector */}
      <div className="space-y-4">
        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
          <Globe size={12} /> AI INFRASTRUCTURE PROVIDER
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {AI_PROVIDERS.map((p) => (
            <button
              key={p.id}
              onClick={() => onUpdate("ai_active_provider", p.id)}
              className={cn(
                "relative group flex items-center gap-3 p-4 rounded-2xl border transition-all duration-300 overflow-hidden",
                activeProviderId === p.id 
                  ? "bg-orange-500/10 border-orange-500/30 ring-1 ring-orange-500/20" 
                  : "bg-zinc-800/20 border-white/5 hover:border-white/10"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs",
                activeProviderId === p.id ? "bg-orange-500 text-white" : "bg-zinc-800 text-zinc-500"
              )}>
                {p.name[0]}
              </div>
              <span className={cn(
                "text-sm font-bold tracking-tight transition-colors",
                activeProviderId === p.id ? "text-white" : "text-zinc-500"
              )}>
                {p.name}
              </span>
              {activeProviderId === p.id && (
                <motion.div 
                  layoutId="active-provider"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Model Selector Area */}
      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
            <Cpu size={12} /> NEURAL MODEL SELECTION
          </label>
          <button 
            onClick={handleAddCustomModel}
            className="text-[10px] font-black text-orange-500 hover:text-orange-400 flex items-center gap-1 transition-colors"
          >
            <Plus size={12} /> ADD CUSTOM MODEL
          </button>
        </div>
        
        <div className="bg-zinc-800/30 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-sm">
          <div className="p-4 border-b border-white/5 flex items-center gap-3">
            <Search size={16} className="text-zinc-600" />
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search available or custom models..."
              className="bg-transparent border-none focus:ring-0 text-sm text-white w-full font-medium"
            />
          </div>
          
          <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
            {filteredModels.map((m) => (
              <button
                key={m.id}
                onClick={() => handleSaveModel(m.id)}
                className={cn(
                  "w-full text-left px-5 py-4 flex items-center justify-between group transition-all border-b border-white/5 last:border-none",
                  activeModelId === m.id ? "bg-orange-500/5" : "hover:bg-white/5"
                )}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-sm font-bold tracking-tight",
                      activeModelId === m.id ? "text-white" : "text-zinc-400 group-hover:text-zinc-300"
                    )}>
                      {m.name}
                    </span>
                    {m.isLatest && (
                      <span className="px-1.5 py-0.5 rounded-md bg-green-500/10 text-green-500 text-[8px] font-black uppercase">Latest</span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 font-medium">{m.description}</p>
                </div>
                {activeModelId === m.id && (
                  <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                    <Check size={14} className="text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* API Configuration */}
      <div className="grid md:grid-cols-2 gap-8 pt-4">
        <div className="space-y-4">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
            <Lock size={12} /> SECURITY CREDENTIALS
          </label>
          <div className="relative group">
            <input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => onUpdate("ai_api_key", e.target.value)}
              className="w-full bg-zinc-800/40 border border-white/5 rounded-2xl px-5 py-4 text-white text-sm font-bold focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-zinc-700"
              placeholder={`Enter ${activeProvider.name} API Key...`}
            />
            <button 
              onClick={() => setShowKey(!showKey)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <p className="text-[10px] text-zinc-600 font-medium italic">
            *Keys are encrypted using AES-256-GCM before storage.
          </p>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
            <ExternalLink size={12} /> CUSTOM ENDPOINT (OPTIONAL)
          </label>
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => onUpdate("ai_base_url", e.target.value)}
            disabled={!activeProvider.baseUrlSupport}
            className="w-full bg-zinc-800/40 border border-white/5 rounded-2xl px-5 py-4 text-white text-sm font-bold focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed"
            placeholder="https://api.groq.com/openai/v1"
          />
        </div>
      </div>

      {/* Hyper-Parameters */}
      <div className="bg-zinc-800/20 border border-white/5 rounded-3xl p-6 space-y-6">
        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-2">
          <Info size={12} className="text-orange-500" /> NEURAL GRADIENT PARAMETERS
        </label>
        
        <div className="grid md:grid-cols-2 gap-10">
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500 font-bold uppercase">Temperature</span>
              <span className="text-white font-black italic">{temperature.toFixed(2)}</span>
            </div>
            <input 
              type="range" 
              min="0" max="2" step="0.01"
              value={temperature}
              onChange={(e) => onUpdate("ai_temperature", e.target.value)}
              className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
            <p className="text-[9px] text-zinc-600 font-medium">Lower values = more deterministic, higher = more creative.</p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500 font-bold uppercase">Max Inference Tokens</span>
              <span className="text-white font-black italic">{maxTokens}</span>
            </div>
            <div className="flex items-center gap-3">
              {[1024, 2048, 4096, 8192, 16384].map(vol => (
                <button
                  key={vol}
                  onClick={() => onUpdate("ai_max_tokens", vol.toString())}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-[10px] font-black transition-all",
                    maxTokens === vol 
                      ? "bg-orange-500 text-white" 
                      : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700"
                  )}
                >
                  {vol / 1024}K
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Risk Management & MTF Strategy */}
      <div className="space-y-6">
        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
          <ShieldCheck size={12} className="text-orange-500" /> RISK MANAGEMENT & MTF STRATEGY
        </label>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-zinc-800/20 border border-white/5 rounded-3xl p-6 flex items-center justify-between group hover:border-orange-500/20 transition-all">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-zinc-500 uppercase">Max Open Positions</span>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-black text-white italic">{maxOpenPositions}</span>
                <div className="flex flex-col gap-1">
                  <button 
                    onClick={() => onUpdate("risk_max_open_positions", (maxOpenPositions + 1).toString())}
                    className="p-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-400"
                  >
                    <Plus size={10} />
                  </button>
                  <button 
                    onClick={() => onUpdate("risk_max_open_positions", Math.max(1, maxOpenPositions - 1).toString())}
                    className="p-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-400"
                  >
                    <Trash2 size={10} className="scale-75" />
                  </button>
                </div>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500">
              <Zap size={20} />
            </div>
          </div>

          <div className="bg-zinc-800/20 border border-white/5 rounded-3xl p-6 space-y-4 group hover:border-orange-500/20 transition-all">
            <div className="flex justify-between items-center text-[10px] font-black text-zinc-500 uppercase">
              <span>Risk Per Trade</span>
              <span className="text-orange-500">{riskPerTrade.toFixed(1)}%</span>
            </div>
            <input 
              type="range" 
              min="0.1" max="10" step="0.1"
              value={riskPerTrade}
              onChange={(e) => onUpdate("risk_per_trade_pct", e.target.value)}
              className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
            <div className="flex justify-between text-[8px] font-black text-zinc-600 uppercase">
              <span>Conservative</span>
              <span>Aggressive</span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-zinc-800/20 border border-white/5 rounded-3xl p-6 flex items-center justify-between group hover:border-orange-500/20 transition-all">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-zinc-500 uppercase">Break-Even Strategy</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">RR 1:1 + Fee Cover</span>
                <button 
                  onClick={() => onUpdate("risk_be_buffer_pct", beBuffer === "0" ? "0.05" : "0")}
                  className={cn(
                    "w-8 h-4 rounded-full transition-all relative",
                    beBuffer !== "0" ? "bg-orange-500" : "bg-zinc-700"
                  )}
                >
                  <div className={cn(
                    "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all shadow-sm",
                    beBuffer !== "0" ? "right-0.5" : "left-0.5"
                  )} />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-zinc-800/20 border border-white/5 rounded-3xl p-6 flex items-center justify-between group hover:border-orange-500/20 transition-all">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-zinc-500 uppercase">Reversal Engine</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">Auto-Switch Bias</span>
                <button 
                  onClick={() => onUpdate("risk_reversal_enabled", (!riskReversalEnabled).toString())}
                  className={cn(
                    "w-8 h-4 rounded-full transition-all relative",
                    riskReversalEnabled ? "bg-orange-500" : "bg-zinc-700"
                  )}
                >
                  <div className={cn(
                    "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all shadow-sm",
                    riskReversalEnabled ? "right-0.5" : "left-0.5"
                  )} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-4">
          <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
            <Info size={16} />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-white tracking-tight">Multi-Timeframe Trend Filtering (ACTIVE)</h4>
            <p className="text-[10px] text-zinc-500 leading-relaxed font-medium">
              Internal Engine will automatically fetch and analyze 15m, 1h, 4h, and 1d data. 
              The AI will reject entry signals if the trend index across timeframes is contradictory.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
