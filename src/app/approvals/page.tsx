"use client";

import React, { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { supabase } from "@/lib/supabase";
import {
    XCircle,
    Search,
    Loader2,
    ShieldCheck,
    Clock,
    FileSearch,
    Package,
    ShieldAlert,
    CheckCircle2,
    Filter,
    History,
    ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function ApprovalsPage() {
    const { profile, loading: authLoading } = useAuth();
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const isAuthorized = profile?.role === "SUPERVISOR" || profile?.role === "GESTOR" || profile?.role === "ADMIN";

    useEffect(() => {
        if (!authLoading && !isAuthorized) {
            toast.error("Acesso exclusivo para supervisores");
            router.push("/");
            return;
        }
        if (isAuthorized) {
            fetchPendingApprovals();
        }
    }, [authLoading, isAuthorized, router]);

    const fetchPendingApprovals = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from("products")
                .select(`
                    *,
                    product_logs (
                        data,
                        created_at
                    )
                `)
                .eq("status", "TECNICO")
                .order("updated_at", { ascending: false });

            if (error) throw error;
            setProducts((data as Product[]) || []);
        } catch (error) {
            console.error("Erro ao buscar aprovações:", error);
            toast.error("Erro ao carregar fila de aprovação");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = async (productId: string, action: "APPROVE" | "REJECT") => {
        setIsProcessing(productId);
        const newStatus = action === "APPROVE" ? "SUPERVISOR" : "CADASTRO";

        try {
            const { error: updateError } = await supabase
                .from("products")
                .update({ status: newStatus })
                .eq("id", productId);

            if (updateError) throw updateError;

            const { error: logError } = await supabase
                .from("product_logs")
                .insert({
                    product_id: productId,
                    old_status: "TECNICO",
                    new_status: newStatus,
                    user_id: profile?.id,
                    data: {
                        action: action,
                        reviewer_role: profile?.role,
                        timestamp: new Date().toISOString()
                    }
                });

            if (logError) throw logError;

            toast.success(action === "APPROVE" ? "Produto Aprovado!" : "Produto Rejeitado", {
                description: action === "APPROVE" ? "Enviado para conferência final do gestor." : "Retornado para a fila de cadastro."
            });

            setProducts(prev => prev.filter(p => p.id !== productId));
        } catch (error) {
            const err = error as Error;
            toast.error("Erro ao processar ação", { description: err.message });
        } finally {
            setIsProcessing(null);
        }
    };

    const filteredProducts = products.filter(p =>
        (p.internal_serial || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.model || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (authLoading) return null; // MainLayout gerencia isso

    if (!isAuthorized) return null; // Lógica de redirecionamento no useEffect

    if (isLoading) {
        return (
            <MainLayout>
                <div className="max-w-7xl mx-auto flex h-[80vh] flex-col items-center justify-center space-y-6">
                    <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-pulse" />
                        <Loader2 className="h-16 w-16 animate-spin text-primary relative z-10 opacity-40" />
                    </div>
                    <div className="text-center space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground animate-pulse">Acessando Central de Revisão</p>
                        <p className="text-[8px] text-muted-foreground/40 uppercase tracking-widest">Validando protocolos de segurança industrial</p>
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="max-w-7xl mx-auto space-y-10 pb-12">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                <ShieldCheck className="h-4 w-4" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Conformidade & QA</span>
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic">Central de <span className="text-primary not-italic font-light">Revisão</span></h1>
                        <p className="text-muted-foreground font-medium text-sm mt-1 opacity-70 italic">Validação de qualidade, triagem técnica e liberação de ativos.</p>
                    </div>
                    <div className="glass-card flex items-center gap-4 py-4 px-8 border-white/5 bg-neutral-900/50 shadow-inner">
                        <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-sm"><Clock className="h-5 w-5" /></div>
                        <div>
                            <div className="text-[9px] uppercase font-black text-muted-foreground tracking-widest leading-none mb-1">Lead Time de Revisão</div>
                            <div className="text-lg font-black text-white italic tracking-widest">14.2 <span className="text-[10px] not-italic font-medium opacity-50">min/avg</span></div>
                        </div>
                    </div>
                </div>

                {/* Search Interface */}
                <div className="flex flex-col md:flex-row items-center gap-4 py-2">
                    <div className="relative flex-1 group w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar por Modelo, Serial ou Técnico..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-2xl border border-white/10 bg-neutral-900/50 py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all text-white shadow-inner backdrop-blur-sm placeholder:text-muted-foreground/30"
                        />
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <button className="flex-1 md:flex-none px-8 h-14 bg-neutral-900/50 rounded-2xl border border-white/10 text-[10px] font-black uppercase tracking-widest text-white flex items-center justify-center gap-3 hover:bg-white/5 transition-all shadow-inner">
                            <Filter className="h-4 w-4 text-primary" />
                            Filtros
                        </button>
                        <button className="flex-1 md:flex-none px-8 h-14 bg-neutral-900/50 rounded-2xl border border-white/10 text-[10px] font-black uppercase tracking-widest text-white flex items-center justify-center gap-3 hover:bg-white/5 transition-all shadow-inner">
                            <History className="h-4 w-4 text-primary" />
                            Histórico
                        </button>
                    </div>
                </div>

                {filteredProducts.length > 0 ? (
                    <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                        {filteredProducts.map((product) => {
                            const lastLog = (product as any).product_logs?.find((l: any) => l.data?.checklist);
                            const checklist = lastLog?.data?.checklist || {};
                            const itemsCount = Object.keys(checklist).length || 0;
                            const checkedCount = Object.values(checklist).filter(v => v === true).length || 0;

                            return (
                                <div key={product.id} className="glass-card group hover:border-primary/50 transition-all duration-500 overflow-hidden flex flex-col border-white/5 bg-neutral-900/30">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <div className="p-8 space-y-6 flex-1">
                                        <div className="flex items-start justify-between">
                                            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-105 group-hover:bg-primary group-hover:text-white transition-all shadow-inner border border-primary/20">
                                                <Package className="h-7 w-7" />
                                            </div>
                                            <span className="font-mono text-[10px] bg-white/5 px-3 py-1.5 rounded-xl text-muted-foreground border border-white/5 shadow-sm group-hover:text-primary transition-colors">
                                                {product.internal_serial}
                                            </span>
                                        </div>

                                        <div className="space-y-1">
                                            <h3 className="font-black text-xl text-white group-hover:text-primary transition-colors uppercase italic tracking-tight">{product.model}</h3>
                                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em]">{product.brand}</p>
                                        </div>

                                        <div className="space-y-3 pt-4 border-t border-white/5">
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Evidências Técnicas</span>
                                                    <span className="text-xs font-bold text-white/80 italic">{checkedCount} de {itemsCount} Checkpoints</span>
                                                </div>
                                                <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                                                    <CheckCircle2 className={cn("h-5 w-5", checkedCount === itemsCount ? "text-emerald-500" : "text-amber-500")} />
                                                </div>
                                            </div>
                                            <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/5">
                                                <div
                                                    className={cn(
                                                        "h-full rounded-full transition-all duration-1000",
                                                        checkedCount === itemsCount ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" : "bg-gradient-to-r from-amber-600 to-amber-400"
                                                    )}
                                                    style={{ width: itemsCount > 0 ? `${(checkedCount / itemsCount) * 100}%` : '0%' }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-white/5 border-t border-white/5 grid grid-cols-5 gap-3">
                                        <button
                                            onClick={() => handleAction(product.id, "APPROVE")}
                                            disabled={!!isProcessing}
                                            className="col-span-4 h-14 bg-white text-black hover:bg-primary hover:text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 active:scale-95 shadow-lg group/btn overflow-hidden relative"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000" />
                                            {isProcessing === product.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                                            Aprovar Lote
                                        </button>
                                        <button
                                            onClick={() => handleAction(product.id, "REJECT")}
                                            disabled={!!isProcessing}
                                            className="col-span-1 h-14 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center active:scale-95 group/reject"
                                            title="Rejeitar e Devolver ao Cadastro"
                                        >
                                            <XCircle className="h-6 w-6 group-hover/reject:rotate-90 transition-transform duration-300" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="glass-card flex flex-col items-center justify-center py-32 text-center border-dashed border border-white/5 bg-neutral-900/20">
                        <div className="h-24 w-24 rounded-full bg-white/5 flex items-center justify-center mb-8 relative">
                            <FileSearch className="h-10 w-10 text-muted-foreground/20" />
                            <div className="absolute inset-0 rounded-full border-2 border-primary/10 border-t-primary animate-spin" style={{ animationDuration: '8s' }} />
                        </div>
                        <h3 className="text-3xl font-black text-white mb-3 uppercase tracking-tighter">Fila de Revisão Limpa</h3>
                        <p className="text-muted-foreground max-w-sm mx-auto text-sm leading-relaxed italic opacity-70">
                            Protocolos operacionalmente em dia. <br />
                            Não existem novas inspeções técnicas pendentes de auditoria.
                        </p>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
