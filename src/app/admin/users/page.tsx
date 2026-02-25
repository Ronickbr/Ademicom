"use client";

import React, { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { supabase } from "@/lib/supabase";
import {
    Users,
    UserPlus,
    Shield,
    Mail,
    Calendar,
    Loader2,
    Search,
    MoreVertical,
    Check,
    X,
    UserCircle,
    ShieldCheck,
    Plus,
    Settings,
    ChevronRight,
    Lock,
    User
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { Profile, UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";

const ROLES: UserRole[] = ["TECNICO", "SUPERVISOR", "GESTOR", "ADMIN"];

export default function UsersManagementPage() {
    const { profile, loading: authLoading } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState<Profile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // New User State
    const [newUser, setNewUser] = useState({
        email: "",
        password: "",
        fullName: "",
        role: "TECNICO" as UserRole
    });

    const isAuthorized = profile?.role === "ADMIN" || profile?.role === "GESTOR";

    useEffect(() => {
        if (!authLoading && !isAuthorized) {
            router.push("/");
        } else if (isAuthorized) {
            fetchUsers();
        }
    }, [authLoading, isAuthorized]);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setUsers((data as Profile[]) || []);
        } catch (error) {
            console.error("Erro ao buscar usuários:", error);
            toast.error("Erro ao carregar lista de usuários");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateRole = async (userId: string, newRole: UserRole) => {
        try {
            const { error } = await supabase
                .from("profiles")
                .update({ role: newRole })
                .eq("id", userId);

            if (error) throw error;

            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
            setEditingId(null);
            toast.success("Perfil atualizado com sucesso!");
        } catch (error) {
            toast.error("Erro ao atualizar perfil");
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const { data, error } = await supabase.functions.invoke("create-user", {
                body: {
                    email: newUser.email,
                    password: newUser.password,
                    fullName: newUser.fullName,
                    role: newUser.role
                }
            });

            if (error) throw error;
            if (data?.error) throw new Error(data.error);

            toast.success("Usuário criado com sucesso!");
            setShowAddModal(false);
            setNewUser({ email: "", password: "", fullName: "", role: "TECNICO" });
            fetchUsers();
        } catch (error) {
            const err = error as Error;
            console.error("Erro ao criar usuário:", err);
            toast.error("Erro ao criar usuário", { description: err.message });
        } finally {
            setIsSaving(false);
        }
    };

    const filteredUsers = users.filter(u =>
        (u.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role.toLowerCase().includes(searchTerm.toLowerCase())
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
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground animate-pulse">Acessando Registro Central</p>
                        <p className="text-[8px] text-muted-foreground/40 uppercase tracking-widest">Segurança Nível Protocolo 0</p>
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
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Controle de Identidade & Acesso</span>
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic">Gestão de <span className="text-primary not-italic font-light">Membros</span></h1>
                        <p className="text-muted-foreground font-medium text-sm mt-1 opacity-70 italic">Administração de permissões, cargos e auditoria de segurança.</p>
                    </div>
                    <button onClick={() => setShowAddModal(true)} className="px-8 h-14 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-3">
                        <Plus className="h-4 w-4" />
                        NOVO MEMBRO
                    </button>
                </div>

                {/* Search & Filters */}
                <div className="flex flex-col md:flex-row gap-4 py-2">
                    <div className="relative flex-1 group max-w-2xl w-full">
                        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Localizar membro por nome, email ou cargo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-2xl border border-white/10 bg-neutral-900/50 py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all text-white shadow-inner backdrop-blur-sm placeholder:text-muted-foreground/30"
                        />
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <button className="flex-1 md:flex-none px-8 h-14 bg-neutral-900/50 rounded-2xl border border-white/10 text-[10px] font-black uppercase tracking-widest text-white flex items-center justify-center gap-3 hover:bg-white/5 transition-all shadow-inner">
                            <Settings className="h-4 w-4 text-primary" />
                            Políticas
                        </button>
                    </div>
                </div>

                {/* Users List */}
                <div className="grid gap-4 lg:grid-cols-2">
                    {filteredUsers.map((u) => (
                        <div key={u.id} className="glass-card border-white/5 bg-neutral-900/40 p-6 flex items-start justify-between group hover:border-primary/30 transition-all duration-500 overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="flex gap-5">
                                <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-primary/10 group-hover:border-primary/30 transition-all">
                                    <UserCircle className="h-7 w-7 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <h3 className="font-bold text-lg text-white group-hover:text-primary transition-colors">{u.full_name || "Sem Nome"}</h3>
                                        <span className={cn(
                                            "text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border shadow-sm",
                                            u.role === "ADMIN" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                                                u.role === "GESTOR" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                                    u.role === "SUPERVISOR" ? "bg-sky-500/10 text-sky-400 border-sky-500/20" :
                                                        "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                        )}>
                                            {u.role}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-60">
                                        <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> {new Date(u.created_at || "").toLocaleDateString("pt-BR")}</span>
                                        <span className="flex items-center gap-1.5"><Shield className="h-3 w-3" /> ID: {u.id.substring(0, 8)}...</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {editingId === u.id ? (
                                    <div className="flex gap-1 bg-black/40 p-1 rounded-xl border border-white/10 animate-in fade-in zoom-in duration-300">
                                        {ROLES.map(role => (
                                            <button
                                                key={role}
                                                onClick={() => handleUpdateRole(u.id, role)}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all",
                                                    u.role === role
                                                        ? "bg-primary text-white"
                                                        : "text-muted-foreground hover:bg-white/5 hover:text-white"
                                                )}
                                            >
                                                {role}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="p-1.5 rounded-lg text-muted-foreground hover:bg-white/5 ml-1"
                                        >
                                            <ChevronRight className="h-5 w-5" />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setEditingId(u.id)}
                                        className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 hover:bg-primary/20 hover:border-primary/50 transition-all text-muted-foreground hover:text-primary shadow-inner"
                                    >
                                        <Shield className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Create Profile Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-500">
                        <div className="glass-card w-full max-w-md space-y-8 border-white/10 shadow-2xl p-10 bg-neutral-900/90 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

                            <div className="flex items-center justify-between relative">
                                <div className="space-y-1">
                                    <h2 className="text-3xl font-black text-white tracking-tight">Novo Acesso</h2>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-black">Provisionamento de Credenciais</p>
                                </div>
                                <button onClick={() => setShowAddModal(false)} className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-muted-foreground hover:text-white transition-all hover:bg-red-500/20 hover:text-red-500 border border-white/10">
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateUser} className="space-y-6 relative">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nome Completo</label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                            <input
                                                type="text"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary transition-all font-bold"
                                                placeholder="Ex: João Silva"
                                                value={newUser.fullName}
                                                onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">E-mail Corporativo</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                            <input
                                                type="email"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary transition-all font-bold"
                                                placeholder="exemplo@empresa.com"
                                                value={newUser.email}
                                                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Senha Inicial</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                            <input
                                                type="password"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary transition-all font-bold"
                                                placeholder="••••••••"
                                                value={newUser.password}
                                                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Cargo / Nível de Acesso</label>
                                        <div className="relative group">
                                            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                            <select
                                                className="w-full bg-neutral-800 border border-white/10 rounded-xl pl-12 pr-10 py-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary transition-all appearance-none font-bold"
                                                value={newUser.role}
                                                onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                                            >
                                                <option value="TECNICO">Técnico Operacional</option>
                                                <option value="SUPERVISOR">Supervisor de QA</option>
                                                <option value="GESTOR">Gestor Logístico</option>
                                                <option value="ADMIN">Administrador de Sistema</option>
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground opacity-50">
                                                <ChevronRight className="h-5 w-5 rotate-90" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 flex flex-col gap-3">
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="h-16 bg-primary text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:brightness-110 active:scale-95 disabled:grayscale disabled:opacity-50 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 border-t border-white/10"
                                    >
                                        {isSaving ? <Loader2 className="h-6 w-6 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                                        Autorizar Acesso
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="h-16 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-white"
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
