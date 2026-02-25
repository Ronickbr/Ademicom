"use client";

import React, { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import {
    Search,
    Filter,
    History,
    Box,
    User,
    Loader2,
    AlertCircle,
    X,
    CheckCircle2,
    ClipboardList,
    ShieldCheck,
    Package,
    ArrowUpRight,
    Edit2,
    Trash2,
    FileDown,
    Download,
    Layers
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { exportToPDF, exportToExcel } from "@/lib/export-utils";
import { useAuth } from "@/components/providers/AuthProvider";
import { Product, ProductLog } from "@/lib/types";

const statusConfig = {
    CADASTRO: { label: "Cadastro", color: "bg-neutral-500/10 text-neutral-400 border-neutral-500/20", icon: Search },
    LEITURA: { label: "Leitura", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: Search },
    TECNICO: { label: "Técnico", color: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: ClipboardList },
    SUPERVISOR: { label: "Supervisor", color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20", icon: CheckCircle2 },
    GESTOR: { label: "Gestor", color: "bg-orange-500/10 text-orange-500 border-orange-500/20", icon: ShieldCheck },
    LIBERADO: { label: "Liberado", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: Package },
};

interface InventoryProduct extends Product {
    orders: {
        id: string;
        clients: {
            name: string;
        };
    } | null;
}

export default function InventoryPage() {
    const { profile } = useAuth();
    const [products, setProducts] = useState<InventoryProduct[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    const [selectedProduct, setSelectedProduct] = useState<InventoryProduct | null>(null);
    const [history, setHistory] = useState<ProductLog[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [editingProduct, setEditingProduct] = useState<InventoryProduct | null>(null);
    const [deletingProduct, setDeletingProduct] = useState<InventoryProduct | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from("products")
                .select("*, orders:order_id (id, clients (name))")
                .order("updated_at", { ascending: false });

            if (error) throw error;
            setProducts((data as InventoryProduct[]) || []);
        } catch (error) {
            const err = error as Error;
            toast.error("Erro ao carregar estoque", { description: err.message });
        } finally {
            setIsLoading(false);
        }
    };

    const fetchHistory = async (product: InventoryProduct) => {
        setSelectedProduct(product);
        setIsLoadingHistory(true);
        try {
            const { data, error } = await supabase
                .from("product_logs")
                .select("*")
                .eq("product_id", product.id)
                .order("created_at", { ascending: false });
            if (error) throw error;
            setHistory((data as ProductLog[]) || []);
        } catch (error) {
            toast.error("Falha ao carregar histórico");
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProduct) return;
        setIsSaving(true);
        try {
            const { error: updateError } = await supabase
                .from("products")
                .update({
                    brand: editingProduct.brand,
                    model: editingProduct.model,
                    original_serial: editingProduct.original_serial,
                    voltage: editingProduct.voltage,
                })
                .eq("id", editingProduct.id);
            if (updateError) throw updateError;
            toast.success("Dados atualizados!");
            setEditingProduct(null);
            fetchInventory();
        } catch (error: any) {
            toast.error("Erro na atualização", { description: error.message });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingProduct) return;
        setIsSaving(true);
        try {
            const { error: deleteError } = await supabase.from("products").delete().eq("id", deletingProduct.id);
            if (deleteError) throw deleteError;
            toast.success("Registro removido.");
            setDeletingProduct(null);
            fetchInventory();
        } catch (error: any) {
            toast.error("Erro ao remover", { description: error.message });
        } finally {
            setIsSaving(false);
        }
    };

    const handleExport = (type: 'PDF' | 'EXCEL') => {
        if (type === 'PDF') {
            const headers = ["ID", "Marca", "Modelo", "Status", "Serial"];
            const pdfData = filteredProducts.map(p => [p.internal_serial, p.brand, p.model, p.status, p.original_serial]);
            exportToPDF("Inventário Industrial", headers, pdfData, "estoque");
        } else {
            const data = filteredProducts.map(p => ({
                ID: p.internal_serial,
                Marca: p.brand,
                Modelo: p.model,
                Status: p.status,
                Original: p.original_serial,
                Cliente: p.orders?.clients?.name || "-"
            }));
            exportToExcel(data, "estoque_industrial");
        }
        toast.info(`Exportação ${type} iniciada`);
    };

    const filteredProducts = products.filter(p => {
        const searchStr = `${p.internal_serial} ${p.brand} ${p.model} ${p.original_serial}`.toLowerCase();
        const match = searchStr.includes(searchTerm.toLowerCase());
        const matchStatus = statusFilter === "ALL" || p.status === statusFilter;
        return match && matchStatus;
    });

    const isAuthorized = profile?.role === "GESTOR" || profile?.role === "ADMIN";

    return (
        <MainLayout>
            <div className="max-w-7xl mx-auto space-y-8 pb-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                <Layers className="h-4 w-4" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Intelligence & Assets</span>
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic leading-none">
                            Controle de <span className="text-primary tracking-normal font-light not-italic">Inventário</span>
                        </h1>
                        <p className="text-muted-foreground font-medium text-sm mt-2 opacity-70 italic">Monitoramento em tempo real de ativos e equipamentos industriais.</p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-4 bg-neutral-900/50 border border-white/5 rounded-2xl px-6 py-3 shadow-inner">
                            <Box className="h-5 w-5 text-primary" />
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Total Ativos</span>
                                <span className="text-sm font-black text-white">{products.length} Unidades</span>
                            </div>
                        </div>
                        <div className="flex items-center bg-white/5 rounded-xl p-1 border border-white/10 shadow-lg">
                            <button
                                onClick={() => handleExport('PDF')}
                                className="p-2.5 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-white transition-all active:scale-90"
                                title="Exportar PDF"
                            >
                                <FileDown className="h-5 w-5" />
                            </button>
                            <button
                                onClick={() => handleExport('EXCEL')}
                                className="p-2.5 hover:bg-white/10 rounded-lg text-emerald-500 hover:text-emerald-400 transition-all active:scale-90"
                                title="Exportar Excel"
                            >
                                <Download className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-neutral-900/40 p-2 rounded-2xl border border-white/5">
                    <div className="md:col-span-3 relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Rastrear por ID, Marca, Modelo ou Serial..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full h-14 bg-transparent border-none rounded-xl pl-12 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all text-white"
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="w-full h-14 bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all cursor-pointer text-white font-bold"
                        >
                            <option value="ALL" className="bg-neutral-900">Todos os Status</option>
                            {Object.entries(statusConfig).map(([val, conf]) => (
                                <option key={val} value={val} className="bg-neutral-900">{conf.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {isLoading ? (
                    <div className="h-[40vh] flex flex-col items-center justify-center gap-6">
                        <div className="relative">
                            <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
                            <Loader2 className="h-12 w-12 animate-spin text-primary relative z-10" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground animate-pulse">Sincronizando Ativos...</p>
                    </div>
                ) : filteredProducts.length > 0 ? (
                    <div className="glass-card overflow-hidden border-white/5 shadow-2xl bg-neutral-900/30">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse min-w-[1000px]">
                                <thead>
                                    <tr className="bg-white/[0.02] border-b border-white/5">
                                        <th className="px-6 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Especificação Técnica</th>
                                        <th className="px-6 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">ID Rastreio</th>
                                        <th className="px-6 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Fase do Fluxo</th>
                                        <th className="px-6 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Destinação</th>
                                        <th className="px-6 py-6 text-right text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Ações Gerais</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredProducts.map(p => {
                                        const config = statusConfig[p.status as keyof typeof statusConfig];
                                        return (
                                            <tr key={p.id} className="group hover:bg-white/[0.02] transition-all duration-300">
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-primary/50 group-hover:bg-primary/5 transition-all">
                                                            <Layers className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-white text-base group-hover:text-primary transition-colors tracking-tight">{p.brand} {p.model}</p>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className="text-[9px] font-black text-primary uppercase tracking-widest bg-primary/5 px-1.5 py-0.5 rounded border border-primary/10">{p.voltage || "BIVOLT"}</span>
                                                                <span className="text-[9px] text-muted-foreground uppercase tracking-widest">{new Date(p.updated_at).toLocaleDateString()}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col font-mono">
                                                        <span className="text-white font-bold text-xs tracking-wider">{p.internal_serial}</span>
                                                        <span className="text-[9px] text-muted-foreground/60 uppercase tracking-tighter">Serial: {p.original_serial}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    {config && (
                                                        <div className={cn(
                                                            "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.1em] border shadow-sm transition-all",
                                                            config.color
                                                        )}>
                                                            <config.icon className="h-3 w-3" />
                                                            {config.label}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-5">
                                                    {p.orders ? (
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center text-primary border border-white/10 shadow-inner">
                                                                <User className="h-3.5 w-3.5" />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-black text-white uppercase tracking-tight">{p.orders.clients?.name}</span>
                                                                <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">Cliente Ativo</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-muted-foreground/30">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                                                            <span className="text-[9px] font-black uppercase tracking-widest italic">Stock Local</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <div className="flex items-center justify-end gap-2 group-hover:translate-x-[-4px] transition-transform">
                                                        <button
                                                            onClick={() => fetchHistory(p)}
                                                            className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/5 text-muted-foreground hover:bg-primary hover:text-white transition-all border border-white/10 shadow-sm"
                                                            title="Histórico de Movimentações"
                                                        >
                                                            <History className="h-4 w-4" />
                                                        </button>
                                                        {isAuthorized && (
                                                            <>
                                                                <button
                                                                    onClick={() => setEditingProduct({ ...p })}
                                                                    className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/5 text-muted-foreground hover:bg-white hover:text-black transition-all border border-white/10 shadow-sm"
                                                                    title="Editar Ativo"
                                                                >
                                                                    <Edit2 className="h-4 w-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => setDeletingProduct(p)}
                                                                    className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/5 text-muted-foreground hover:bg-red-500 hover:text-white transition-all border border-white/10 shadow-sm"
                                                                    title="Remover Registro"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="h-[50vh] flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-white/5 rounded-[3rem] bg-white/[0.01] relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Box className="h-20 w-20 text-white/5 mb-8 animate-bounce transition-all duration-1000" />
                        <h3 className="text-3xl font-black uppercase tracking-tighter text-white">Nenhum Registro Localizado</h3>
                        <p className="text-muted-foreground italic text-sm mt-3 max-w-sm mx-auto leading-relaxed">
                            {searchTerm ? "O filtro atual não retornou resultados aproximados. Tente simplificar sua pesquisa." : "Sua base de inventário está vazia. Inicie cadastrando novos equipamentos."}
                        </p>
                    </div>
                )}

                {/* Modal de Edição */}
                {editingProduct && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl animate-in fade-in duration-300">
                        <div className="glass-card w-full max-w-xl p-10 border-white/10 shadow-4xl space-y-10 bg-neutral-900 absolute overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />

                            <div className="flex justify-between items-start relative z-10">
                                <div>
                                    <h2 className="text-4xl font-black uppercase tracking-tighter text-white mb-1">Atualizar Ativo</h2>
                                    <p className="text-[10px] font-black text-primary tracking-[0.4em] uppercase opacity-80">{editingProduct.internal_serial}</p>
                                </div>
                                <button onClick={() => setEditingProduct(null)} className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-neutral-800 transition-all border border-white/10 text-white shadow-lg"><X className="h-6 w-6" /></button>
                            </div>

                            <form onSubmit={handleUpdate} className="space-y-6 relative z-10">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Fabricante / Marca</label>
                                        <input
                                            required
                                            className="w-full h-15 bg-white/5 border border-white/10 rounded-2xl px-5 text-white focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none shadow-inner font-bold transition-all"
                                            value={editingProduct.brand || ""}
                                            onChange={e => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Modelo Comercial</label>
                                        <input
                                            required
                                            className="w-full h-15 bg-white/5 border border-white/10 rounded-2xl px-5 text-white focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none shadow-inner font-bold transition-all"
                                            value={editingProduct.model || ""}
                                            onChange={e => setEditingProduct({ ...editingProduct, model: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Número de Serial Original</label>
                                    <input
                                        required
                                        className="w-full h-15 bg-white/5 border border-white/10 rounded-2xl px-5 text-primary font-mono font-black focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none shadow-inner transition-all tracking-widest"
                                        value={editingProduct.original_serial || ""}
                                        onChange={e => setEditingProduct({ ...editingProduct, original_serial: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-6">
                                    <button
                                        type="button"
                                        onClick={() => setEditingProduct(null)}
                                        className="h-16 rounded-2xl border border-white/10 text-muted-foreground font-black uppercase tracking-widest text-[10px] hover:bg-white/5 hover:text-white transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        disabled={isSaving}
                                        className="h-16 rounded-2xl bg-primary text-white hover:bg-primary/90 font-black uppercase tracking-widest text-[10px] transition-all disabled:opacity-50 shadow-xl shadow-primary/20 border-t border-white/20 flex items-center justify-center gap-3"
                                    >
                                        {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                                        Salvar Alterações
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal de Exclusão */}
                {deletingProduct && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/98 backdrop-blur-3xl animate-in zoom-in-95 duration-300">
                        <div className="glass-card w-full max-w-md p-12 border-red-500/30 shadow-4xl text-center space-y-10 bg-neutral-950 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent" />
                            <div className="h-24 w-24 rounded-3xl bg-red-500/10 flex items-center justify-center mx-auto ring-8 ring-red-500/5 rotate-12 group-hover:rotate-0 transition-transform"><AlertCircle className="h-12 w-12 text-red-500" /></div>
                            <div className="space-y-4">
                                <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Excluir Permanente?</h2>
                                <p className="text-sm text-muted-foreground italic leading-relaxed px-4 opacity-70">
                                    Esta ação é irreversível e irá apagar todos os vínculos e logs do ativo <span className="text-white font-black underline decoration-red-500/50 underline-offset-4">{deletingProduct.internal_serial}</span>.
                                </p>
                            </div>
                            <div className="flex flex-col gap-4">
                                <button
                                    onClick={handleDelete}
                                    disabled={isSaving}
                                    className="h-16 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-red-500/30 transition-all active:scale-95 flex items-center justify-center gap-3"
                                >
                                    {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
                                    Confirmar Destruição
                                </button>
                                <button
                                    onClick={() => setDeletingProduct(null)}
                                    className="h-12 text-muted-foreground hover:text-white font-black text-[10px] uppercase transition-all tracking-[0.3em]"
                                >
                                    Manter Registro Seguro
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal de Histórico */}
                {selectedProduct && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl animate-in fade-in duration-300">
                        <div className="glass-card w-full max-w-3xl p-10 border-white/10 shadow-5xl max-h-[90vh] flex flex-col bg-neutral-900 absolute">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />

                            <div className="flex justify-between items-start mb-12 relative z-10">
                                <div className="flex gap-6 items-center">
                                    <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner"><History className="h-9 w-9" /></div>
                                    <div>
                                        <h2 className="text-4xl font-black uppercase tracking-tighter text-white leading-none mb-1">{selectedProduct.brand} {selectedProduct.model}</h2>
                                        <p className="text-[10px] font-black text-primary tracking-[0.5em] uppercase opacity-70">Log de Rastreabilidade • {selectedProduct.internal_serial}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedProduct(null)} className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-neutral-800 transition-all border border-white/10 text-white shadow-lg"><X className="h-6 w-6" /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-6 space-y-10 scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-primary/30 transition-colors">
                                {isLoadingHistory ? (
                                    <div className="py-32 flex flex-col items-center gap-4 opacity-30">
                                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Recuperando registros...</span>
                                    </div>
                                ) : history.length > 0 ? (
                                    <div className="relative pl-10 border-l-2 border-primary/10 space-y-12 pb-10 ml-4">
                                        {history.map((log) => (
                                            <div key={log.id} className="relative">
                                                <div className="absolute -left-[3.1rem] top-1 h-8 w-8 rounded-xl bg-neutral-900 border-2 border-primary shadow-[0_0_20px_rgba(14,165,233,0.3)] flex items-center justify-center z-10">
                                                    <ArrowUpRight className="h-4 w-4 text-primary" />
                                                </div>
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center bg-white/[0.03] p-4 rounded-xl border border-white/5">
                                                        <p className="text-[10px] font-black text-white uppercase tracking-widest">Status Alterado para: <span className="text-primary ml-2">{log.new_status}</span></p>
                                                        <span className="text-[9px] font-black text-muted-foreground opacity-50 uppercase tracking-tighter font-mono">{new Date(log.created_at).toLocaleString("pt-BR")}</span>
                                                    </div>

                                                    {log.data?.observations && (
                                                        <div className="p-5 rounded-2xl bg-neutral-950 border border-white/5 relative group">
                                                            <div className="absolute top-4 left-0 w-1 h-4 bg-primary/40 rounded-r-full" />
                                                            <p className="text-xs text-muted-foreground/90 italic leading-relaxed pl-2 font-medium">
                                                                &ldquo;{log.data.observations}&rdquo;
                                                            </p>
                                                        </div>
                                                    )}

                                                    {log.data?.checklist && (
                                                        <div className="flex flex-wrap gap-2">
                                                            {Object.entries(log.data.checklist).map(([key, val]) => (
                                                                <div key={key} className={cn(
                                                                    "px-3 py-1.5 rounded-lg border flex items-center gap-2 transition-all",
                                                                    val ? "bg-emerald-500/5 text-emerald-500 border-emerald-500/20" : "bg-red-500/5 text-red-500 border-red-500/20"
                                                                )}>
                                                                    <div className={cn("h-1.5 w-1.5 rounded-full", val ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]")} />
                                                                    <span className="text-[9px] font-black uppercase tracking-widest">{key}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-40 text-center flex flex-col items-center gap-4">
                                        <Box className="h-14 w-14 text-white/5" />
                                        <p className="text-muted-foreground italic text-sm font-medium tracking-tight">O equipamento ainda não possui histórico de movimentações.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
