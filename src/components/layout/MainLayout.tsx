"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Scan,
    CheckCircle2,
    Users,
    Package,
    ClipboardList,
    ShieldCheck,
    LogOut,
    Menu,
    X
} from "lucide-react";
import { cn } from "@/lib/utils";

import { useAuth } from "@/components/providers/AuthProvider";

const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard, roles: ["TECNICO", "SUPERVISOR", "GESTOR", "ADMIN"] },
    { name: "Escanear", href: "/scan", icon: Scan, roles: ["TECNICO", "SUPERVISOR", "GESTOR", "ADMIN"] },
    { name: "Técnico", href: "/technician", icon: ClipboardList, roles: ["TECNICO", "SUPERVISOR", "GESTOR", "ADMIN"] },
    { name: "Supervisor", href: "/approvals", icon: CheckCircle2, roles: ["SUPERVISOR", "GESTOR", "ADMIN"] },
    { name: "Gestor", href: "/manager", icon: ShieldCheck, roles: ["GESTOR", "ADMIN"] },
    { name: "Estoque", href: "/inventory", icon: Package, roles: ["TECNICO", "SUPERVISOR", "GESTOR", "ADMIN"] },
    { name: "Clientes", href: "/clients", icon: Users, roles: ["GESTOR", "ADMIN"] },
    { name: "Pedidos", href: "/orders", icon: Package, roles: ["GESTOR", "ADMIN"] },
    { name: "Usuários", href: "/admin/users", icon: Users, roles: ["ADMIN", "GESTOR"] },
];

export function MainLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { profile, signOut, loading } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    const userRole = profile?.role || "TECNICO";
    const filteredNavigation = navigation.filter(item => item.roles.includes(userRole));

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
                <div className="flex flex-col items-center gap-6 animate-in fade-in duration-700">
                    <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-primary/20 blur-3xl animate-pulse" />
                        <LayoutDashboard className="h-16 w-16 text-primary animate-spin-slow relative z-10" />
                    </div>
                    <div className="text-center space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary animate-pulse">Sincronizando Ambiente</p>
                        <p className="text-[8px] text-muted-foreground uppercase tracking-widest opacity-40">Segurança de Dados • Ambicom</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Sidebar Desktop */}
            <aside className="fixed left-0 top-0 hidden h-full w-64 border-r border-border bg-card/30 backdrop-blur-md lg:block">
                <div className="flex h-16 items-center px-6 border-b border-border">
                    <span className="text-xl font-bold tracking-tight text-white">Scan<span className="text-primary italic">Relatório</span></span>
                </div>

                {/* User Profile Summary */}
                <div className="p-4 border-b border-white/5">
                    <div className="bg-white/5 rounded-xl p-3 flex items-center gap-3 border border-white/5">
                        <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                            {profile?.full_name?.substring(0, 2).toUpperCase() || "US"}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-xs font-bold text-white truncate">{profile?.full_name || "Usuário"}</span>
                            <span className="text-[8px] font-bold text-primary uppercase tracking-tighter opacity-80">{profile?.role}</span>
                        </div>
                    </div>
                </div>

                <nav className="flex flex-col gap-1 p-4">
                    {filteredNavigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                    isActive
                                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                                        : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
                <div className="absolute bottom-4 w-full px-4">
                    <button
                        onClick={signOut}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                    >
                        <LogOut className="h-4 w-4" />
                        Sair do Sistema
                    </button>
                </div>
            </aside>

            {/* Header Mobile */}
            <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md lg:hidden">
                <span className="text-lg font-bold text-primary">Scan-relatorio</span>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
                    {isMobileMenuOpen ? <X /> : <Menu />}
                </button>
            </header>

            {/* Mobile Menu Backdrop */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Mobile Drawer */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 w-64 transform bg-card/95 backdrop-blur-xl transition-transform duration-300 ease-in-out lg:hidden flex flex-col shadow-2xl border-r border-white/10",
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex h-16 items-center justify-between px-6 border-b border-border">
                    <span className="text-xl font-bold text-primary">Menu de Acesso</span>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-muted-foreground">
                        <X className="h-6 w-6" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <nav className="flex flex-col gap-1 p-4">
                        {filteredNavigation.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                                        isActive
                                            ? "bg-primary text-white"
                                            : "text-muted-foreground hover:bg-white/5"
                                    )}
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
                <div className="p-4 border-t border-white/5">
                    <button
                        onClick={() => {
                            setIsMobileMenuOpen(false);
                            signOut();
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-destructive bg-destructive/5 hover:bg-destructive/10 transition-all border border-destructive/10"
                    >
                        <LogOut className="h-4 w-4" />
                        Sair do Sistema
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="lg:pl-64">
                <div className="container mx-auto p-4 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
