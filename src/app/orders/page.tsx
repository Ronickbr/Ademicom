"use client";

import React, { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import {
    Plus,
    Search,
    User,
    Loader2,
    AlertCircle,
    X,
    FileDown,
    Download,
    Package,
    Calendar,
    ChevronRight,
    Filter
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { exportToPDF, exportToExcel } from "@/lib/export-utils";
import { Order, Client, Product } from "@/lib/types";

const statusStyles = {
    PENDENTE: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    CONCLUIDO: "bg-green-500/10 text-green-500 border-green-500/20",
    CANCELADO: "bg-red-500/10 text-red-500 border-red-500/20",
};

export default function OrdersPage() {
    const { profile, loading: authLoading } = useAuth();
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const [showAddModal, setShowAddModal] = useState(false);
    const [clients, setClients] = useState<Client[]>([]);
    const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
    const [selectedClient, setSelectedClient] = useState("");
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const isAuthorized = profile?.role === "GESTOR" || profile?.role === "ADMIN";

    useEffect(() => {
        if (!authLoading && !isAuthorized) {
            toast.error("Acesso restrito");
            router.push("/");
            return;
        }
        if (isAuthorized) {
            fetchOrders();
        }
    }, [authLoading, isAuthorized, router]);

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const { data, error: fetchError } = await supabase
                .from("orders")
                .select(`
                    *,
                    clients (name)
                `)
                .order("created_at", { ascending: false });

            if (fetchError) throw fetchError;
            setOrders((data as Order[]) || []);
        } catch (error: any) {
            console.error("Erro ao buscar pedidos:", error);
            toast.error("Erro ao carregar pedidos", { description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportPDF = () => {
        const headers = ["Pedido ID", "Cliente", "Status", "Data de Criação"];
        const data = filteredOrders.map(o => [
            o.id.split("-")[0],
            o.clients?.name || "N/A",
            o.status,
            new Date(o.created_at).toLocaleDateString("pt-BR")
        ]);
        exportToPDF("Relatório de Pedidos - ScanRelatório", headers, data, "pedidos");
    };

    const handleExportExcel = () => {
        const data = filteredOrders.map(o => ({
            "ID Pedido": o.id,
            "Cliente": o.clients?.name || "N/A",
            "Status": o.status,
            "Data": new Date(o.created_at).toLocaleString("pt-BR")
        }));
        exportToExcel(data, "pedidos_scan");
    };

    const prepareNewOrder = async () => {
        setShowAddModal(true);
        const { data: cData } = await supabase.from("clients").select("*");
        setClients((cData as Client[]) || []);
        const { data: pData } = await supabase.from("products").select("*").eq("status", "GESTOR");
        setAvailableProducts((pData as Product[]) || []);
    };

    const handleCreateOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClient || selectedProducts.length === 0) {
            toast.error("Selecione um cliente e pelo menos um produto.");
            return;
        }

        setIsSaving(true);
        try {
            const { data: orderData, error: orderError } = await supabase
                .from("orders")
                .insert([{
                    client_id: selectedClient,
                    status: "PENDENTE",
                }])
                .select()
                .single();

            if (orderError) throw orderError;

            const { error: productError } = await supabase
                .from("products")
                .update({
                    order_id: (orderData as Order).id,
                    status: "LIBERADO"
                })
                .in("id", selectedProducts);

            if (productError) throw productError;

            toast.success("Pedido criado com sucesso!", {
                description: `${selectedProducts.length} produtos foram vinculados.`
            });
            setShowAddModal(false);
            setSelectedClient("");
            setSelectedProducts([]);
            fetchOrders();
        } catch (error: any) {
            toast.error("Erro ao criar pedido", { description: error.message });
        } finally {
            setIsSaving(false);
        }
    };

    const filteredOrders = orders.filter(o =>
        o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.clients?.name || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (authLoading) return null; // MainLayout gerencia isso

    if (!isAuthorized) return null; // Lógica de redirecionamento no useEffect

    if (isLoading) {
        return (
            <MainLayout>
                <div className="max-w-7xl mx-auto flex h-[60vh] flex-col items-center justify-center space-y-6">
                    <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-pulse" />
                        <Loader2 className="h-10 w-10 animate-spin text-primary relative z-10 opacity-40" />
                    </div>
                    <div className="text-center space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground animate-pulse">Sincronizando Registros</p>
                        <p className="text-[8px] text-muted-foreground/40 uppercase tracking-widest">Acessando banco de ordens e remessas</p>
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
                                <Package className="h-4 w-4" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Logística & Expedição</span>
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic">Logística <span className="text-primary not-italic font-light">& Expedição</span></h1>
                        <p className="text-muted-foreground font-medium text-sm mt-1 opacity-70 italic">Gerenciamento de fluxo de saída e ordens de serviço.</p>
                    </div>
                    <button
                        onClick={prepareNewOrder}
                        className="flex-[2] md:flex-none h-14 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-[10px] px-10 rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-3 whitespace-nowrap"
                    >
                        <Plus className="h-4 w-4" />
                        Novo Pedido
                    </button>
                </div>

                <div className="flex flex-col md:flex-row gap-4 py-2">
                    <div className="relative flex-1 group max-w-2xl w-full">
                        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Pesquisar por ID ou Cliente..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-2xl border border-white/10 bg-neutral-900/50 py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all text-white shadow-inner backdrop-blur-sm"
                        />
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-4 bg-neutral-900/50 border border-white/5 rounded-2xl px-6 py-3 shadow-inner">
                            <Download className="h-5 w-5 text-emerald-500" />
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Faturamento</span>
                                <span className="text-sm font-black text-white">{orders.length} Totais</span>
                            </div>
                        </div>
                        <div className="flex items-center bg-white/5 rounded-xl p-1 border border-white/10 shadow-lg">
                            <button
                                onClick={handleExportPDF}
                                className="p-2.5 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-white transition-all active:scale-90"
                                title="Exportar PDF"
                            >
                                <FileDown className="h-5 w-5" />
                            </button>
                            <button
                                onClick={handleExportExcel}
                                className="p-2.5 hover:bg-white/10 rounded-lg text-emerald-500 hover:text-emerald-400 transition-all active:scale-90"
                                title="Exportar Excel"
                            >
                                <Download className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {filteredOrders.length > 0 ? (
                    <div className="glass-card overflow-hidden rounded-2xl border border-white/10 shadow-2xl p-0">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead className="bg-white/5 text-muted-foreground uppercase text-[10px] font-black tracking-widest border-b border-white/5">
                                <tr>
                                    <th className="px-6 py-5">Código</th>
                                    <th className="px-6 py-5">Cliente / Destino</th>
                                    <th className="px-6 py-5 text-center">Status</th>
                                    <th className="px-6 py-5">Data Estimada</th>
                                    <th className="px-6 py-5"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredOrders.map((order) => (
                                    <tr key={order.id} className="group hover:bg-white/[0.02] transition-all">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all border border-primary/10">
                                                    <Package className="h-4 w-4" />
                                                </div>
                                                <span className="font-mono text-sm font-bold text-white/80 group-hover:text-primary transition-colors">
                                                    #{order.id.split("-")[0].toUpperCase()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-white font-bold text-base leading-tight">{order.clients?.name}</span>
                                                <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1 font-bold">Venda Direta</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className={cn("inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm", statusStyles[order.status as keyof typeof statusStyles])}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold bg-white/5 w-fit px-3 py-1 rounded-lg border border-white/5 shadow-inner">
                                                <Calendar className="h-3 w-3 text-primary" />
                                                {new Date(order.created_at).toLocaleDateString("pt-BR")}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <button className="h-10 w-10 flex items-center justify-center text-muted-foreground hover:bg-white/10 rounded-xl transition-all group-hover:text-white hover:scale-110 active:scale-95 border border-transparent hover:border-white/10">
                                                <ChevronRight className="h-5 w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="glass-card flex flex-col items-center justify-center py-24 text-center border-dashed border-2 border-white/5 bg-white/[0.01]">
                        <div className="h-24 w-24 rounded-full bg-white/5 flex items-center justify-center mb-8 relative shadow-inner">
                            <AlertCircle className="h-12 w-12 text-muted-foreground/20" />
                            <div className="absolute inset-0 rounded-full border border-white/5 animate-pulse" />
                        </div>
                        <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Sem resultados</h3>
                        <p className="text-muted-foreground max-w-sm mx-auto text-sm leading-relaxed italic opacity-80">
                            {searchTerm ? "Não encontramos nada para sua busca. Tente palavras-chave diferentes." : "O fluxo de faturamento está pronto. Inicie criando um novo pedido de saída."}
                        </p>
                    </div>
                )}

                {/* Modal de Novo Pedido */}
                {showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-500">
                        <div className="glass-card w-full max-w-2xl space-y-8 border-white/10 shadow-2xl p-10 bg-neutral-900/90 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

                            <div className="flex items-center justify-between relative">
                                <div className="space-y-1">
                                    <h2 className="text-3xl font-black text-white tracking-tight">Novo Pedido</h2>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-black">Fluxo de Expedição de Inventário</p>
                                </div>
                                <button onClick={() => setShowAddModal(false)} className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-muted-foreground hover:text-white transition-all hover:bg-red-500/20 hover:text-red-500 border border-white/10">
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateOrder} className="space-y-8 relative">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 block">1. Definir Cliente de Destino</label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <select
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-10 h-16 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all appearance-none text-white shadow-inner font-bold"
                                            value={selectedClient}
                                            onChange={(e) => setSelectedClient(e.target.value)}
                                        >
                                            <option value="" className="bg-neutral-900 text-muted-foreground">Selecione o cliente / parceiro...</option>
                                            {clients.map(c => (
                                                <option key={c.id} value={c.id} className="bg-neutral-900">{c.name}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground opacity-50 group-focus-within:opacity-100 transition-opacity">
                                            <ChevronRight className="h-5 w-5 rotate-90" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between mb-1 ml-1">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">2. Selecionar Itens para Remessa</label>
                                        <span className="text-[10px] font-black px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">{selectedProducts.length} ITENS</span>
                                    </div>
                                    <div className="border border-white/10 rounded-2xl bg-black/40 p-3 max-h-72 overflow-y-auto space-y-2 custom-scrollbar shadow-inner backdrop-blur-sm">
                                        {availableProducts.length > 0 ? availableProducts.map(p => (
                                            <label key={p.id} className={cn("flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer group/item", selectedProducts.includes(p.id) ? "bg-primary/10 border-primary/50 shadow-lg" : "hover:bg-white/5 border-white/5 bg-white/[0.02]")}>
                                                <div className="relative flex items-center justify-center">
                                                    <input
                                                        type="checkbox"
                                                        className="h-6 w-6 rounded-lg border-white/10 bg-white/5 text-primary focus:ring-primary accent-primary cursor-pointer"
                                                        checked={selectedProducts.includes(p.id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) setSelectedProducts([...selectedProducts, p.id]);
                                                            else setSelectedProducts(selectedProducts.filter(id => id !== p.id));
                                                        }}
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-4">
                                                        <p className="font-bold text-sm text-white truncate group-hover/item:text-primary transition-colors">{p.model}</p>
                                                        <span className="font-mono text-[10px] px-2 py-0.5 bg-white/5 rounded text-primary border border-primary/20 font-black uppercase tracking-tighter shadow-sm flex-shrink-0">
                                                            {p.internal_serial}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1 opacity-60">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Liberado Gestor</p>
                                                    </div>
                                                </div>
                                            </label>
                                        )) : (
                                            <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 opacity-50">
                                                <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center">
                                                    <Package className="h-8 w-8 text-muted-foreground" />
                                                </div>
                                                <p className="text-xs text-muted-foreground italic leading-relaxed font-medium">Nenhum item disponível no momento.<br />Aguarde a liberação gerencial no inventário.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="submit"
                                        disabled={isSaving || availableProducts.length === 0 || selectedProducts.length === 0}
                                        className="flex-[2] h-16 bg-primary text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:brightness-110 active:scale-95 disabled:grayscale disabled:opacity-50 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 border-t border-white/10"
                                    >
                                        {isSaving ? <Loader2 className="h-6 w-6 animate-spin" /> : <Download className="h-6 w-6" />}
                                        Finalizar Remessa
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="flex-1 h-16 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-white"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
