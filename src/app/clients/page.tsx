"use client";

import React, { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Plus, Search, User, Mail, Phone, MapPin, Loader2, AlertCircle, X, Edit2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/AuthProvider";
import { Client } from "@/lib/types";

export default function ClientsPage() {
    const { profile } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [stats, setStats] = useState({ total: 0, new: 0, growth: "0%" });
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [clientForm, setClientForm] = useState({ name: "", tax_id: "", email: "", phone: "", address: "" });
    const [isSaving, setIsSaving] = useState(false);

    const canEdit = profile?.role === "GESTOR" || profile?.role === "ADMIN";

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from("clients")
                .select("*")
                .order("name", { ascending: true });

            if (error) throw error;
            const clientList = (data as Client[]) || [];
            setClients(clientList);

            // Calculate Stats
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const newThisMonth = clientList.filter(c => new Date(c.created_at) > thirtyDaysAgo).length;
            const total = clientList.length;
            const previousTotal = total - newThisMonth;
            const growth = previousTotal > 0 ? `${Math.round((newThisMonth / previousTotal) * 100)}%` : "100%";

            setStats({ total, new: newThisMonth, growth });
        } catch (error: any) {
            console.error("Erro ao buscar clientes:", error);
            toast.error("Erro ao carregar clientes", { description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteClient = async (id: string, name: string) => {
        if (!confirm(`Tem certeza que deseja remover o parceiro "${name}"? Esta ação não pode ser desfeita.`)) return;

        setIsDeleting(id);
        try {
            const { error } = await supabase.from("clients").delete().eq("id", id);
            if (error) throw error;

            toast.success("Parceiro removido com sucesso");
            fetchClients();
        } catch (error: any) {
            toast.error("Erro ao remover", { description: error.message });
        } finally {
            setIsDeleting(null);
        }
    };

    const formatTaxId = (value: string) => {
        const numbers = value.replace(/\D/g, "");
        if (numbers.length <= 11) {
            return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4").substring(0, 14);
        }
        return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5").substring(0, 18);
    };

    const formatPhone = (value: string) => {
        const numbers = value.replace(/\D/g, "");
        if (numbers.length <= 10) {
            return numbers.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3").substring(0, 14);
        }
        return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3").substring(0, 15);
    };

    const handleOpenModal = (client: Client | null = null) => {
        if (client) {
            setEditingClient(client);
            setClientForm({
                name: client.name || "",
                tax_id: client.tax_id || "",
                email: client.email || "",
                phone: client.phone || "",
                address: client.address || ""
            });
        } else {
            setEditingClient(null);
            setClientForm({ name: "", tax_id: "", email: "", phone: "", address: "" });
        }
        setShowModal(true);
    };

    const handleSaveClient = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (editingClient) {
                const { error } = await supabase
                    .from("clients")
                    .update(clientForm)
                    .eq("id", editingClient.id);

                if (error) throw error;
                toast.success("Cliente atualizado!");
            } else {
                const { error } = await supabase
                    .from("clients")
                    .insert([clientForm]);

                if (error) throw error;
                toast.success("Cliente cadastrado!");
            }

            setShowModal(false);
            fetchClients();
        } catch (error: any) {
            toast.error("Erro ao salvar", { description: error.message });
        } finally {
            setIsSaving(false);
        }
    };

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.tax_id || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <MainLayout>
            <div className="max-w-7xl mx-auto space-y-10 pb-12">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                <User className="h-4 w-4" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">CRM & Partnerships</span>
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic leading-none">
                            Base de <span className="text-primary tracking-normal font-light not-italic">Clientes</span>
                        </h1>
                        <p className="text-muted-foreground font-medium text-sm mt-2 opacity-70 italic">Gestão estratégica de parceiros e histórico de relacionamento.</p>
                    </div>
                    <div className="flex items-center gap-4 bg-neutral-900/50 border border-white/5 rounded-2xl px-6 py-3 shadow-inner">
                        <Plus className="h-5 w-5 text-primary" />
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Base Ativa</span>
                            <span className="text-sm font-black text-white">{clients.length} Contatos</span>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-6 sm:grid-cols-3">
                    <div className="glass-card group hover:border-primary/50 transition-all duration-500 relative overflow-hidden bg-neutral-900/40">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex items-center justify-between mb-6">
                            <div className="rounded-2xl bg-white/5 p-4 text-blue-500 group-hover:bg-primary group-hover:text-white transition-all shadow-inner border border-white/5">
                                <User className="h-7 w-7" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Total de Parceiros</p>
                            <p className="text-4xl font-black text-white tracking-tighter">{stats.total}</p>
                        </div>
                    </div>
                    <div className="glass-card group hover:border-emerald-500/50 transition-all duration-500 relative overflow-hidden bg-neutral-900/40">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex items-center justify-between mb-6">
                            <div className="rounded-2xl bg-white/5 p-4 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-inner border border-white/5">
                                <Plus className="h-7 w-7" />
                            </div>
                            <div className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase border border-emerald-500/20">
                                +{stats.growth}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Novos Contratos (30d)</p>
                            <p className="text-4xl font-black text-white tracking-tighter">{stats.new}</p>
                        </div>
                    </div>
                    <div className="glass-card group hover:border-amber-500/50 transition-all duration-500 relative overflow-hidden bg-neutral-900/40">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex items-center justify-between mb-6">
                            <div className="rounded-2xl bg-white/5 p-4 text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-all shadow-inner border border-white/5">
                                <MapPin className="h-7 w-7" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Cidades Atendidas</p>
                            <p className="text-4xl font-black text-white tracking-tighter">14</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4 py-2">
                    <div className="relative flex-1 group max-w-2xl w-full">
                        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou documento fiscal..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-2xl border border-white/10 bg-neutral-900/50 py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all text-white shadow-inner backdrop-blur-sm"
                        />
                    </div>
                    {canEdit && (
                        <button
                            onClick={() => handleOpenModal()}
                            className="w-full md:w-auto h-14 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-[10px] px-8 rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-3 whitespace-nowrap"
                        >
                            <Plus className="h-4 w-4" />
                            Novo Parceiro
                        </button>
                    )}
                </div>

                {isLoading ? (
                    <div className="flex h-64 flex-col items-center justify-center space-y-4">
                        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
                        <p className="text-sm text-muted-foreground animate-pulse uppercase tracking-widest">Sincronizando base de dados...</p>
                    </div>
                ) : filteredClients.length > 0 ? (
                    <div className="glass-card p-0 overflow-hidden border-white/10 bg-neutral-900/50">
                        <table className="w-full text-left">
                            <thead className="bg-white/[0.02] border-b border-white/5">
                                <tr className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">
                                    <th className="px-6 py-5">Nome / Contato</th>
                                    <th className="px-6 py-5">Documento</th>
                                    <th className="px-6 py-5">Localização</th>
                                    <th className="px-6 py-5 text-right w-[180px]">Gestão</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredClients.map((client) => (
                                    <tr key={client.id} className="group hover:bg-white/[0.02] transition-colors border-l-2 border-transparent hover:border-primary">
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-white font-bold text-lg leading-tight uppercase tracking-tight group-hover:text-primary transition-colors">{client.name}</span>
                                                <div className="flex items-center gap-3 mt-1 opacity-60">
                                                    <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase font-black tracking-widest"><Mail className="h-3 w-3" /> {client.email || "Sem e-mail"}</span>
                                                    <span className="h-1 w-1 rounded-full bg-white/20" />
                                                    <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase font-black tracking-widest"><Phone className="h-3 w-3" /> {client.phone || "Sem fone"}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="font-mono text-xs text-white/40 group-hover:text-white/80 transition-colors uppercase tracking-widest bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
                                                {client.tax_id || "NÃO INFORMADO"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <p className="text-xs text-muted-foreground line-clamp-1 max-w-[200px] italic">
                                                {client.address || "Endereço pendente"}
                                            </p>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenModal(client)}
                                                    className="h-10 px-4 flex items-center gap-2 text-primary hover:bg-primary/10 rounded-xl transition-all font-black uppercase tracking-widest text-[9px] border border-primary/10 select-none active:scale-95"
                                                >
                                                    <User className="h-3.5 w-3.5" />
                                                    Sincronizar
                                                </button>
                                                {canEdit && (
                                                    <button
                                                        onClick={() => handleDeleteClient(client.id, client.name)}
                                                        disabled={isDeleting === client.id}
                                                        className="h-10 w-10 flex items-center justify-center text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/20 active:scale-90 disabled:opacity-50"
                                                    >
                                                        {isDeleting === client.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="glass-card flex flex-col items-center justify-center py-24 text-center border-dashed border-2 border-white/5 bg-white/[0.01]">
                        <div className="h-24 w-24 rounded-full bg-white/5 flex items-center justify-center mb-8 relative shadow-inner">
                            <User className="h-12 w-12 text-muted-foreground/20" />
                            <div className="absolute inset-0 rounded-full border border-white/5 animate-pulse" />
                        </div>
                        <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Base de Dados Vazia</h3>
                        <p className="text-muted-foreground max-w-sm mx-auto text-sm leading-relaxed italic opacity-80">
                            {searchTerm ? "Nenhum parceiro atende aos critérios da sua pesquisa. Tente palavras-chave diferentes." : "Não há parceiros cadastrados. Utilize o botão superior para iniciar."}
                        </p>
                    </div>
                )}

                {/* Modal de Cadastro/Edição */}
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-500">
                        <div className="glass-card w-full max-w-lg space-y-8 border-white/10 shadow-2xl p-10 bg-neutral-900/95 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

                            <div className="flex items-center justify-between relative">
                                <div className="space-y-1">
                                    <h2 className="text-3xl font-black text-white tracking-tight">{editingClient ? "Sincronizar Perfil" : "Novo Cadastro"}</h2>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-black">Informações do Cliente / Parceiro</p>
                                </div>
                                <button onClick={() => setShowModal(false)} className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-muted-foreground hover:text-white transition-all hover:bg-red-500/20 hover:text-red-500 border border-white/10">
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSaveClient} className="space-y-6 relative">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Nome Completo / Razão Social</label>
                                    <div className="relative group/field">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                            <User className="h-4 w-4 text-muted-foreground group-focus-within/field:text-primary transition-colors" />
                                        </div>
                                        <input
                                            required
                                            value={clientForm.name}
                                            onChange={e => setClientForm({ ...clientForm, name: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 text-white transition-all shadow-inner font-bold"
                                            placeholder="Nome oficial da entidade"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Documento Identificação</label>
                                        <div className="relative group/field">
                                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                                <ShieldCheck className="h-4 w-4 text-muted-foreground group-focus-within/field:text-primary transition-colors" />
                                            </div>
                                            <input
                                                value={clientForm.tax_id}
                                                onChange={e => setClientForm({ ...clientForm, tax_id: formatTaxId(e.target.value) })}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 font-mono text-white transition-all shadow-inner font-bold"
                                                placeholder="CPF ou CNPJ"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Telefone Principal</label>
                                        <div className="relative group/field">
                                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                                <Phone className="h-4 w-4 text-muted-foreground group-focus-within/field:text-primary transition-colors" />
                                            </div>
                                            <input
                                                value={clientForm.phone}
                                                onChange={e => setClientForm({ ...clientForm, phone: formatPhone(e.target.value) })}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 text-white transition-all shadow-inner font-bold"
                                                placeholder="(00) 00000-0000"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">E-mail Corporativo</label>
                                    <div className="relative group/field">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                            <Mail className="h-4 w-4 text-muted-foreground group-focus-within/field:text-primary transition-colors" />
                                        </div>
                                        <input
                                            type="email"
                                            value={clientForm.email}
                                            onChange={e => setClientForm({ ...clientForm, email: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 text-white transition-all shadow-inner font-bold"
                                            placeholder="email@empresa.com.br"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Endereço de Correspondência</label>
                                    <div className="relative group/field">
                                        <div className="absolute top-4 left-4 pointer-events-none">
                                            <MapPin className="h-4 w-4 text-muted-foreground group-focus-within/field:text-primary transition-colors" />
                                        </div>
                                        <textarea
                                            value={clientForm.address}
                                            onChange={e => setClientForm({ ...clientForm, address: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-5 py-4 h-28 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 resize-none text-white transition-all shadow-inner font-bold"
                                            placeholder="Rua, Número, Bairro, Cidade - Estado"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="flex-[2] bg-primary hover:brightness-110 text-white font-black uppercase tracking-[0.2em] text-[10px] h-16 rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 border-t border-white/10 flex items-center justify-center gap-3"
                                    >
                                        {isSaving ? <Loader2 className="h-6 w-6 animate-spin" /> : <ShieldCheck className="h-6 w-6" />}
                                        {editingClient ? "Sincronizar Alterações" : "Efetivar Cadastro"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-white h-16"
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

const ShieldCheck = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
        <path d="m9 12 2 2 4-4" />
    </svg>
);
