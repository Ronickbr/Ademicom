"use client";

import React, { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { supabase } from "@/lib/supabase";
import {
    ShieldCheck,
    XCircle,
    Search,
    Loader2,
    TrendingUp,
    Box,
    CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { Product } from "@/lib/types";

export default function ManagerDashboard() {
    const { profile, loading: authLoading } = useAuth();
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const isAuthorized = profile?.role === "GESTOR" || profile?.role === "ADMIN";

    useEffect(() => {
        if (!authLoading && !isAuthorized) {
            toast.error("Acesso restrito");
            router.push("/");
            return;
        }
        if (isAuthorized) {
            fetchManagerQueue();
        }
    }, [authLoading, isAuthorized, router]);

    const fetchManagerQueue = async () => {
        setIsLoading(true);
        try {
            const { data, error: queueError } = await supabase
                .from("products")
                .select(`
                    *,
                    product_logs (
                        data,
                        created_at
                    )
                `)
                .eq("status", "SUPERVISOR")
                .order("updated_at", { ascending: false });

            if (queueError) throw queueError;
            setProducts((data as Product[]) || []);
        } catch (fetchError) {
            console.error("Erro ao buscar fila do gestor:", fetchError);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = async (productId: string, action: "RELEASE" | "RETURN") => {
        setIsProcessing(productId);
        const newStatus = action === "RELEASE" ? "GESTOR" : "TECNICO";

        try {
            const { error: updateError } = await supabase
                .from("products")
                .update({
                    status: newStatus,
                    stock_status: action === "RELEASE" ? "DISPONIVEL" : "INDISPONIVEL"
                })
                .eq("id", productId);

            if (updateError) throw updateError;

            const { error: logError } = await supabase
                .from("product_logs")
                .insert({
                    product_id: productId,
                    old_status: "SUPERVISOR",
                    new_status: newStatus,
                    user_id: profile?.id,
                    data: {
                        manager_action: action,
                        release_timestamp: new Date().toISOString(),
                        final_decision: action
                    }
                });

            if (logError) throw logError;

            toast.success(action === "RELEASE" ? "Produto Liberado!" : "Retornado ao Técnico", {
                description: action === "RELEASE" ? "O produto está pronto para ser vinculado a um pedido." : "Necessário revisão técnica adicional."
            });

            setProducts(prev => prev.filter(p => p.id !== productId));
        } catch (actionError) {
            const err = actionError as Error;
            toast.error("Erro ao processar liberação", { description: err.message });
        } finally {
            setIsProcessing(null);
        }
    };

    const filteredProducts = products.filter(p =>
        (p.internal_serial || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.model || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (authLoading || isLoading) {
        return (
            <MainLayout>
                <div className="flex h-[80vh] flex-col items-center justify-center space-y-6">
                    <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-pulse" />
                        <Loader2 className="h-16 w-16 animate-spin text-primary relative z-10" />
                    </div>
                    <div className="text-center space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground animate-pulse">Autenticando Nível Gestor...</p>
                        <p className="text-xs text-muted-foreground/60 italic">Validando credenciais de governança corporativa</p>
                    </div>
                </div>
            </MainLayout>
        );
    }

    if (!isAuthorized) return null;

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
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Governance & Release</span>
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic leading-none">
                            Controle de <span className="text-primary tracking-normal font-light not-italic">Aprovação</span>
                        </h1>
                        <p className="text-muted-foreground font-medium text-sm mt-2 opacity-70 italic">Validação final e liberação estratégica de ativos para o mercado.</p>
                    </div>
                    <div className="flex items-center gap-4 bg-neutral-900/50 border border-white/5 rounded-2xl px-6 py-3 shadow-inner">
                        <TrendingUp className="h-5 w-5 text-emerald-500" />
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Eficiência</span>
                            <span className="text-sm font-black text-white">98.5% Global</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 py-2">
                    <div className="relative flex-1 group max-w-2xl">
                        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar por ID Interno, Modelo ou Marca..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-2xl border border-white/10 bg-neutral-900/50 py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all text-white shadow-inner backdrop-blur-sm"
                        />
                    </div>
                </div>

                {filteredProducts.length > 0 ? (
                    <div className="grid gap-6 lg:grid-cols-2">
                        {filteredProducts.map((product) => (
                            <div key={product.id} className="glass-card group hover:border-emerald-500/30 transition-all duration-300 overflow-hidden bg-neutral-900/50">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                                    <ShieldCheck className="h-20 w-20 text-emerald-500" />
                                </div>

                                <div className="flex items-start justify-between border-b border-white/5 pb-4 mb-4 relative">
                                    <div className="flex gap-4">
                                        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all border border-primary/10">
                                            <Box className="h-7 w-7" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-xl text-white group-hover:text-primary transition-colors">{product.model}</h3>
                                            <p className="text-xs text-muted-foreground uppercase font-black tracking-widest">{product.brand}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-mono text-[10px] bg-white/5 px-3 py-1 rounded-full text-primary tracking-tighter font-bold border border-primary/20 shadow-inner">
                                            {product.internal_serial}
                                        </div>
                                        <p className="text-[9px] text-muted-foreground mt-1 italic">Entrada: {new Date(product.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-6 relative">
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 group-hover:bg-white/10 transition-all shadow-inner">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="text-[9px] uppercase font-black text-muted-foreground tracking-widest">Revisão Técnica</div>
                                            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                        </div>
                                        <div className="text-xs font-bold text-emerald-500 uppercase">Aprovado S/ Ressalva</div>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 group-hover:bg-white/10 transition-all shadow-inner">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="text-[9px] uppercase font-black text-muted-foreground tracking-widest">Auditoria</div>
                                            <ShieldCheck className="h-3 w-3 text-blue-500" />
                                        </div>
                                        <div className="text-xs font-bold text-blue-500 uppercase">Dados Validados</div>
                                    </div>
                                </div>

                                <div className="flex gap-3 relative">
                                    <button
                                        onClick={() => handleAction(product.id, "RELEASE")}
                                        disabled={!!isProcessing}
                                        className="flex-[2] h-14 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
                                    >
                                        {isProcessing === product.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                                        Liberar para Venda
                                    </button>
                                    <button
                                        onClick={() => handleAction(product.id, "RETURN")}
                                        disabled={!!isProcessing}
                                        className="flex-1 h-14 rounded-2xl border border-white/10 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/20 transition-all flex items-center justify-center gap-2 font-bold text-[10px] uppercase tracking-widest active:scale-95"
                                        title="Retornar para Técnico"
                                    >
                                        <XCircle className="h-4 w-4" />
                                        Recusar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="glass-card flex flex-col items-center justify-center py-24 text-center border-dashed border-2 border-white/5 bg-white/[0.01]">
                        <div className="h-24 w-24 rounded-full bg-emerald-500/5 flex items-center justify-center mb-8 relative">
                            <CheckCircle2 className="h-12 w-12 text-emerald-500/30" />
                            <div className="absolute inset-0 rounded-full border-2 border-emerald-500/10 animate-ping opacity-20" />
                        </div>
                        <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Fila de Liberação Vazia</h3>
                        <p className="text-muted-foreground max-w-sm mx-auto text-sm leading-relaxed italic">
                            Excelente! Todos os produtos revisados pela supervisão já foram processados.
                        </p>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
