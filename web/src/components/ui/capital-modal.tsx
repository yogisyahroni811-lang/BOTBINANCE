"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Settings2, Loader2, DollarSign, Wallet } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

const capitalSchema = z.object({
    amount: z.coerce.number()
        .min(10, "Minimum capital is 10 USDT")
        .max(10000000, "Maximum capital is 10,000,000 USDT"),
    mode: z.enum(["SET", "ADD"]),
});

type CapitalFormData = z.infer<typeof capitalSchema>;

interface CapitalModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentBalance: string;
    onConfirm: (data: CapitalFormData) => Promise<void>;
}

export function CapitalModal({ isOpen, onClose, currentBalance, onConfirm }: CapitalModalProps) {
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<CapitalFormData>({
        resolver: zodResolver(capitalSchema),
        defaultValues: {
            amount: 0,
            mode: "ADD",
        },
    });

    const mode = watch("mode");

    const onSubmit = async (data: CapitalFormData) => {
        setIsSubmitting(true);
        try {
            await onConfirm(data);
            reset();
            onClose();
        } catch (error) {
            console.error("Failed to update capital:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Close on ESC
    React.useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="w-full max-w-md bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-[32px] shadow-2xl overflow-hidden pointer-events-auto"
                        >
                            {/* Header */}
                            <div className="relative p-8 pb-4">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                                        <Wallet className="h-6 w-6 text-blue-500" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold tracking-tight text-white">Adjust Capital</h2>
                                        <p className="text-sm text-zinc-500">Configure your virtual trading balance.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="absolute top-8 right-8 p-2 rounded-full bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Body */}
                            <form onSubmit={handleSubmit(onSubmit)} className="p-8 pt-2 space-y-6">
                                {/* Current Balance Info */}
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Current Balance</span>
                                    <span className="text-lg font-black text-white">${parseFloat(currentBalance).toLocaleString()}</span>
                                </div>

                                {/* Mode Switcher */}
                                <div className="grid grid-cols-2 gap-2 bg-black/20 p-1 rounded-2xl border border-white/5">
                                    <button
                                        type="button"
                                        onClick={() => setValue("mode", "ADD")}
                                        className={cn(
                                            "flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                            mode === "ADD" 
                                                ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" 
                                                : "text-zinc-500 hover:text-white hover:bg-white/5"
                                        )}
                                    >
                                        <Plus className="h-3 w-3" /> Top Up
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setValue("mode", "SET")}
                                        className={cn(
                                            "flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                            mode === "SET" 
                                                ? "bg-zinc-700 text-white shadow-lg" 
                                                : "text-zinc-500 hover:text-white hover:bg-white/5"
                                        )}
                                    >
                                        <Settings2 className="h-3 w-3" /> Set Total
                                    </button>
                                </div>

                                {/* Amount Input */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">
                                        {mode === "ADD" ? "Addition Amount" : "New Total Balance"}
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                            <DollarSign className="h-5 w-5 text-zinc-500 group-focus-within:text-blue-500 transition-colors" />
                                        </div>
                                        <input
                                            {...register("amount")}
                                            type="number"
                                            step="0.01"
                                            autoFocus
                                            placeholder="0.00"
                                            className={cn(
                                                "w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-xl font-bold text-white placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all",
                                                errors.amount && "border-red-500/50 focus:ring-red-500/40 focus:border-red-500/40"
                                            )}
                                        />
                                    </div>
                                    {errors.amount && (
                                        <p className="text-xs text-red-500 font-medium ml-1 animate-in fade-in slide-in-from-top-1">
                                            {errors.amount.message}
                                        </p>
                                    )}
                                </div>

                                {/* Footer Action */}
                                <div className="pt-4 flex gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={onClose}
                                        className="flex-1 rounded-2xl py-6 font-bold border-white/5 hover:bg-white/5"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-[2] rounded-2xl py-6 font-bold bg-blue-500 hover:bg-blue-600 shadow-xl shadow-blue-500/20 transition-all"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            mode === "ADD" ? "Confirm Top-up" : "Update Balance"
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
