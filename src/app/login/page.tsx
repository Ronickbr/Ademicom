"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, Loader2, ShieldCheck, Zap } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) throw signInError;

            toast.success("Bem-vindo de volta!", {
                description: "Login realizado com sucesso.",
            });

            // Redirect to dashboard
            router.push("/");
            router.refresh();
        } catch (error: any) {
            console.error("Login error:", error);
            toast.error("Erro ao entrar", {
                description: error.message || "Verifique suas credenciais.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px]" />
            </div>

            <div className="w-full max-w-md space-y-8 relative">
                {/* Logo Section */}
                <div className="text-center space-y-2">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10 shadow-2xl mb-4">
                        <Zap className="h-8 w-8 text-primary fill-primary" />
                    </div>
                    <h1 className="text-4xl font-extrabold text-white tracking-tighter">
                        Scan<span className="text-primary italic">Relatório</span>
                    </h1>
                    <p className="text-muted-foreground text-sm font-medium tracking-wide">
                        SISTEMA DE RASTREABILIDADE INDUSTRIAL
                    </p>
                </div>

                {/* Login Card */}
                <div className="glass-card p-8 border-white/10 shadow-2xl relative group overflow-hidden bg-neutral-950/50 backdrop-blur-xl">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">E-mail Corporativo</label>
                                <div className="relative group/field">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <Mail className="h-4 w-4 text-muted-foreground group-focus-within/field:text-primary transition-colors" />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all text-sm shadow-inner"
                                        placeholder="seu.email@ambicom.com.br"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Senha de Acesso</label>
                                <div className="relative group/field">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <Lock className="h-4 w-4 text-muted-foreground group-focus-within/field:text-primary transition-colors" />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all text-sm shadow-inner"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Autenticando...
                                </>
                            ) : (
                                <>
                                    Entrar no Sistema
                                    <ShieldCheck className="h-5 w-5" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-white/5 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-relaxed">
                            Acesso restrito a colaboradores autorizados da Ambicom.<br />
                            Suporte técnico: <span className="text-white">TI@ambicom.com.br</span>
                        </p>
                    </div>
                </div>

                {/* Footer Link */}
                <div className="text-center">
                    <button
                        onClick={() => router.push("/")}
                        className="text-xs text-muted-foreground hover:text-white transition-colors uppercase tracking-widest font-bold opacity-50 hover:opacity-100"
                    >
                        Voltar para a página inicial
                    </button>
                </div>
            </div>
        </div>
    );
}
