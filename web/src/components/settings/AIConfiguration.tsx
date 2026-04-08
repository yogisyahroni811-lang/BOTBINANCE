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
  Info
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
    </div>
  );
}
