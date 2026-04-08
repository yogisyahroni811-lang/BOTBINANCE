"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, Setting } from "@/lib/api";
import { motion } from "framer-motion";
import { useState } from "react";
import { 
    Save, 
    Shield, 
    Key, 
    Bell, 
    Zap,
    AlertCircle,
    CheckCircle2,
    Lock
} from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
    const queryClient = useQueryClient();
    const { data: settings, isLoading } = useQuery({
        queryKey: ["settings"],
        queryFn: () => api.getSettings(),
    });

    const mutation = useMutation({
        mutationFn: ({ key, value }: { key: string, value: string }) => api.updateSetting(key, value),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["settings"] });
            toast.success("Setting updated successfully", {
                className: "bg-zinc-900 border-zinc-800 text-white font-bold",
            });
        },
        onError: (err: any) => {
            toast.error(`Failed to update: ${err.message}`);
        }
    });

    const sections = [
        { id: "risk", label: "Risk Management", icon: Shield, color: "text-red-500" },
        { id: "api", label: "API Configuration", icon: Key, color: "text-blue-500" },
        { id: "notification", label: "Notifications", icon: Bell, color: "text-orange-500" },
        { id: "general", label: "General", icon: Zap, color: "text-purple-500" },
    ];

    const [activeSection, setActiveSection] = useState("risk");

    if (isLoading) return <div className="p-8 animate-pulse space-y-4">
        <div className="h-12 w-64 bg-white/5 rounded-lg" />
        <div className="h-96 bg-white/5 rounded-3xl" />
    </div>;

    const filteredSettings = settings?.filter(s => s.category.toLowerCase() === activeSection);

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div>
                <h1 className="text-4xl font-black tracking-tight text-white mb-2 italic">SYSTEM CONFIGURATION</h1>
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Manage your neural execution parameters</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Navigation Sidebar */}
                <div className="w-full lg:w-64 space-y-2">
                    {sections.map(section => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 border ${
                                activeSection === section.id 
                                ? "bg-orange-500/10 border-orange-500/20 text-white shadow-lg shadow-orange-500/5 font-bold" 
                                : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                            }`}
                        >
                            <section.icon size={18} className={activeSection === section.id ? section.color : "text-inherit"} />
                            <span className="text-sm tracking-tight">{section.label}</span>
                        </button>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="flex-1">
                    <motion.div
                        key={activeSection}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="rounded-3xl border border-white/5 bg-zinc-900/40 p-8 backdrop-blur-md"
                    >
                        <div className="flex justify-between items-center mb-8 pb-6 border-b border-white/5">
                            <h3 className="text-xl font-black text-white uppercase italic">{sections.find(s => s.id === activeSection)?.label} Settings</h3>
                            {activeSection === 'api' && <Lock size={16} className="text-zinc-600" />}
                        </div>

                        <div className="space-y-8">
                            {filteredSettings?.map((setting) => (
                                <SettingItem 
                                    key={setting.key} 
                                    setting={setting} 
                                    onSave={(val) => mutation.mutate({ key: setting.key, value: val })}
                                    isSaving={mutation.isPending}
                                />
                            ))}

                            {filteredSettings?.length === 0 && (
                                <div className="text-center py-12">
                                    <AlertCircle size={48} className="mx-auto text-zinc-700 mb-4" />
                                    <p className="text-zinc-500 font-bold tracking-tight">No settings found in this category.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

function SettingItem({ setting, onSave, isSaving }: { setting: Setting, onSave: (val: string) => void, isSaving: boolean }) {
    const [val, setVal] = useState(setting.value);
    const hasChanged = val !== setting.value;

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-end">
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">{setting.key.replace(/_/g, ' ')}</label>
                    <p className="text-sm text-zinc-400 font-medium max-w-md">{setting.description || 'No description available for this parameter.'}</p>
                </div>
                {hasChanged && (
                    <motion.button
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        onClick={() => onSave(val)}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500 text-white text-[10px] font-black hover:bg-orange-600 transition-colors disabled:opacity-50"
                    >
                        {isSaving ? "SAVING..." : <><Save size={12} /> SAVE CHANGES</>}
                    </motion.button>
                )}
            </div>
            
            <div className="relative group">
                <input
                    type={setting.category === 'API' ? 'password' : 'text'}
                    value={val}
                    onChange={(e) => setVal(e.target.value)}
                    className="w-full bg-zinc-800/40 border border-white/5 rounded-xl px-4 py-3 text-white text-sm font-bold focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-zinc-700"
                    placeholder={`Enter value for ${setting.key}...`}
                />
                {!hasChanged && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <CheckCircle2 size={14} className="text-green-500/40" />
                    </div>
                )}
            </div>
        </div>
    );
}
