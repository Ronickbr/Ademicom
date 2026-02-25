"use client";

import React, { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import {
    Loader2,
    ChevronLeft,
    AlertTriangle,
    CheckCircle,
    ClipboardPen,
    Zap
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Product } from "@/lib/types";

const checklistItems = [
    { id: "power", label: "Liga Corretamente?", category: "Funcional" },
    { id: "display", label: "Display/Painel funcionando?", category: "Funcional" },
    { id: "physical_status", label: "Integridade Física (Sem amassados/riscos)", category: "Estético" },
    { id: "cleanliness", label: "Estado de Limpeza", category: "Geral" },
    { id: "cables", label: "Cabos e Conectores íntegros?", category: "Componentes" },
];

export default function TechnicianChecklist() {
    const { id } = useParams();
    const router = useRouter();
    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [checklistData, setChecklistData] = useState<Record<string, boolean>>({});
    const [obs, setObs] = useState("");

    useEffect(() => {
        if (id) fetchProduct();
    }, [id]);

    const fetchProduct = async () => {
        try {
            const { data, error } = await supabase
                .from("products")
                .select("*")
                .eq("id", id)
                .single();

            if (error) throw error;
            setProduct(data as Product);

            const initial: Record<string, boolean> = {};
            checklistItems.forEach(item => initial[item.id] = false);
            setChecklistData(initial);
        } catch (error) {
            console.error("Erro:", error);
            toast.error("Produto não encontrado");
            router.push("/technician");
        } finally {
            setIsLoading(false);
        }
    };

    const toggleItem = (itemId: string) => {
        setChecklistData(prev => ({ ...prev, [itemId]: !prev[itemId] }));
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const { error: updateError } = await supabase
                .from("products")
                .update({
                    status: "TECNICO",
                    stock_status: "DISPONIVEL"
                })
                .eq("id", id);

            if (updateError) throw updateError;

            const { error: logError } = await supabase
                .from("product_logs")
                .insert({
                    product_id: id,
                    old_status: "CADASTRO",
                    new_status: "TECNICO",
                    user_id: (await supabase.auth.getUser()).data.user?.id || null,
                    data: {
                        checklist: checklistData,
                        observations: obs,
                        technician_timestamp: new Date().toISOString()
                    }
                });

            if (logError) throw logError;

            toast.success("Checklist finalizado!", {
                description: "Produto enviado para aprovação do Supervisor."
            });
            router.push("/technician");
        } catch (error) {
            const err = error as Error;
            console.error("Erro ao salvar:", err);
            toast.error("Erro ao finalizar checklist", {
                description: err.message
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <MainLayout>
                <div className="flex h-[80vh] flex-col items-center justify-center space-y-6">
                    <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-pulse" />
                        <Loader2 className="h-16 w-16 animate-spin text-primary relative z-10" />
                    </div>
                </div>
            </MainLayout>
        );
    }

    const allChecked = Object.values(checklistData).every(v => v === true);

    return (
        <MainLayout>
            <div className="max-w-4xl mx-auto space-y-10 pb-24">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-primary transition-all group"
                >
                    <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    Voltar para Fila
                </button>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-white/5 pb-10">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                <ClipboardPen className="h-4 w-4" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Evidência Técnica</span>
                        </div>
                        <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic leading-none">
                            Validação de <span className="text-primary not-italic font-light tracking-normal">Checklist</span>
                        </h1>
                        <p className="text-muted-foreground font-medium text-sm italic opacity-70">Auditoria técnica do ativo: <span className="text-white font-mono not-italic">{product?.internal_serial}</span></p>
                    </div>
                    <div className="glass-card bg-neutral-900 border-white/10 p-6 flex flex-col items-end shadow-2xl min-w-[240px]">
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1 opacity-50 text-right">Especificação</span>
                        <div className="font-black text-xl text-white tracking-tight uppercase italic text-right mb-1">{product?.model}</div>
                        <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{product?.brand}</div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-5 gap-10">
                    <div className="lg:col-span-3 space-y-8">
                        {/* Dynamic Checklist */}
                        <div className="grid gap-3">
                            {checklistItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => toggleItem(item.id)}
                                    className={cn(
                                        "flex items-center justify-between p-6 rounded-2xl border transition-all duration-300 text-left group",
                                        checklistData[item.id]
                                            ? "bg-primary/5 border-primary/40 shadow-[0_0_20px_rgba(14,165,233,0.1)]"
                                            : "bg-white/5 border-white/5 hover:border-white/10"
                                    )}
                                >
                                    <div className="flex items-center gap-6">
                                        <div className={cn(
                                            "h-8 w-8 rounded-xl border-2 flex items-center justify-center transition-all duration-500",
                                            checklistData[item.id] ? "bg-primary border-primary rotate-0 scale-110 shadow-lg shadow-primary/20" : "border-white/10 rotate-45 scale-90"
                                        )}>
                                            {checklistData[item.id] && <CheckCircle className="h-5 w-5 text-white" />}
                                        </div>
                                        <div>
                                            <div className={cn("text-lg font-black tracking-tight transition-colors italic uppercase", checklistData[item.id] ? "text-primary" : "text-white/80")}>
                                                {item.label}
                                            </div>
                                            <div className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-widest mt-0.5">{item.category}</div>
                                        </div>
                                    </div>
                                    {checklistData[item.id] && (
                                        <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest animate-in fade-in zoom-in slide-in-from-right-4">
                                            OK
                                            <CheckCircle className="h-3 w-3" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="lg:col-span-2 space-y-8">
                        {/* Observations */}
                        <div className="glass-card bg-neutral-900/40 space-y-4 p-8 border-white/5">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="h-4 w-4 text-primary" />
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Observações do Laudo</label>
                            </div>
                            <textarea
                                value={obs}
                                onChange={(e) => setObs(e.target.value)}
                                placeholder="Insira detalhes técnicos adicionais ou identifique anomalias não listadas..."
                                className="w-full h-48 rounded-2xl border border-white/5 bg-black/40 p-6 text-sm text-white placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all shadow-inner resize-none"
                            />
                        </div>

                        {!allChecked && (
                            <div className="flex items-start gap-4 p-6 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 animate-in shake-in">
                                <AlertTriangle className="h-6 w-6 mt-0.5 shrink-0" />
                                <div className="space-y-1">
                                    <p className="text-xs font-black uppercase tracking-widest">Protocolo Incompleto</p>
                                    <p className="text-[11px] font-medium opacity-80 leading-relaxed italic text-balance">Existem itens pendentes de validação. O registro necessita de 100% de conformidade para processamento automático.</p>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-4 p-2">
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="btn-primary flex-1 h-16 flex items-center justify-center gap-4 text-xs font-black uppercase tracking-[0.2em] shadow-2xl relative overflow-hidden group/btn disabled:grayscale"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000" />
                                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5" />}
                                Finalizar Protocolo
                            </button>
                            <button
                                onClick={() => router.back()}
                                className="px-8 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-[0.2em] transition-all text-muted-foreground hover:text-white"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
