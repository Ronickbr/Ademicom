"use client";

import React, { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { supabase } from "@/lib/supabase";
import { ClipboardCheck, Search, Loader2, AlertCircle, ChevronRight, Box, Zap, Settings2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Product } from "@/lib/types";

export default function TechnicianDashboard() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchPendingProducts();
    }, []);

    const fetchPendingProducts = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from("products")
                .select("*")
                .eq("status", "CADASTRO")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setProducts((data as Product[]) || []);
        } catch (error) {
            console.error("Erro ao buscar produtos:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredProducts = products.filter(p =>
        (p.internal_serial || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.model || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <MainLayout>
            <div className="max-w-7xl mx-auto space-y-10 pb-12">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                <Settings2 className="h-4 w-4" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Operação Técnica</span>
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic">
                            Painel do <span className="text-primary tracking-normal font-light not-italic">Técnico</span>
                        </h1>
                        <p className="text-muted-foreground font-medium text-sm mt-1 opacity-70 italic">Gerencie a fila de inspeção e validação de ativos.</p>
                    </div>
                </div>

                {/* Search & Filters */}
                <div className="flex items-center gap-4 py-2">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Rastrear por ID Interno ou Modelo de Equipamento..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-neutral-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-sm text-white placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all shadow-inner"
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex h-64 flex-col items-center justify-center space-y-6">
                        <div className="relative">
                            <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-pulse" />
                            <Loader2 className="h-12 w-12 animate-spin text-primary relative z-10" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground animate-pulse text-center">Sincronizando Fila de Trabalho...</p>
                    </div>
                ) : filteredProducts.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {filteredProducts.map((product) => (
                            <Link
                                key={product.id}
                                href={`/technician/checklist/${product.id}`}
                                className="group glass-card border-white/5 bg-neutral-900/40 hover:border-primary/50 transition-all duration-500 relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="flex items-start justify-between mb-6">
                                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                                        <Box className="h-6 w-6" />
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] font-black bg-white/5 px-3 py-1.5 rounded-xl text-muted-foreground group-hover:text-primary uppercase tracking-[0.2em] border border-white/5 transition-colors">
                                            {product.internal_serial}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-black text-xl text-white tracking-tight group-hover:text-primary transition-colors uppercase italic">{product.model}</h3>
                                    <p className="text-xs text-muted-foreground uppercase font-black tracking-widest opacity-60">{product.brand}</p>
                                </div>
                                <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Ingressado em</span>
                                        <span className="text-xs font-medium text-white/50 italic">{new Date(product.created_at).toLocaleDateString("pt-BR")}</span>
                                    </div>
                                    <div className="flex items-center bg-primary/10 text-primary px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2 group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                                        Avaliar <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="glass-card flex flex-col items-center justify-center py-24 text-center border-dashed border-white/5 bg-neutral-900/20">
                        <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center mb-6 relative">
                            <ClipboardCheck className="h-10 w-10 text-muted-foreground opacity-20" />
                            <div className="absolute inset-0 rounded-full border-2 border-primary/10 border-t-primary animate-spin opacity-40" style={{ animationDuration: '6s' }} />
                        </div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Fila Processada!</h3>
                        <p className="text-muted-foreground max-w-sm mx-auto mt-2 text-sm italic opacity-70">
                            Não existem pendências de avaliação técnica. <br />
                            Todos os ativos cadastrados foram validados.
                        </p>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
