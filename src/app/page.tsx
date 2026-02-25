"use client";

import React, { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  TrendingUp,
  Loader2,
  Calendar,
  ArrowRight,
  Target,
  Zap,
  Activity,
  User
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { ProductLog } from "@/lib/types";
import { cn } from "@/lib/utils";

interface DashboardLog {
  id: string;
  new_status: string;
  created_at: string;
  products: {
    brand: string | null;
    model: string | null;
    internal_serial: string | null;
  } | null;
}

export default function Home() {
  const [stats, setStats] = useState([
    { name: "Patrimônio Ativo", value: "0", icon: Package, color: "text-blue-500", key: "TOTAL" },
    { name: "Fila de Inspeção", value: "0", icon: Clock, color: "text-yellow-500", key: "CADASTRO" },
    { name: "Pendente Liberação", value: "0", icon: AlertCircle, color: "text-orange-500", key: "TECNICO" },
    { name: "Total Expedido", value: "0", icon: CheckCircle2, color: "text-emerald-500", key: "LIBERADO" },
  ]);
  const [recentActivity, setRecentActivity] = useState<DashboardLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [leadTime, setLeadTime] = useState({ avg: "4.2h", status: "Excelente" });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Stats from products
      const { data: products } = await supabase.from("products").select("status, created_at");

      if (products) {
        const counts = products.reduce((acc: Record<string, number>, curr: { status: string }) => {
          acc[curr.status] = (acc[curr.status] || 0) + 1;
          return acc;
        }, {});

        setStats(prev => prev.map(s => ({
          ...s,
          value: s.key === "TOTAL" ? products.length.toString() : (counts[s.key] || 0).toString()
        })));
      }

      // 2. Fetch Recent Activity from product_logs
      const { data: logs } = await supabase
        .from("product_logs")
        .select(`
                    id,
                    new_status,
                    created_at,
                    products (brand, model, internal_serial)
                `)
        .order("created_at", { ascending: false })
        .limit(5);

      setRecentActivity((logs as unknown as DashboardLog[]) || []);

      // 3. Simple Lead Time Sim (Real would calculate diff between LEITURA and LIBERADO)
      setLeadTime({ avg: "4.2h", status: "Excelente" });

    } catch (error) {
      console.error("Erro dashboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto flex h-[60vh] flex-col items-center justify-center space-y-6">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-pulse" />
            <Loader2 className="h-12 w-12 animate-spin text-primary relative z-10 opacity-40" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground animate-pulse">Consolidando Dashboards</p>
            <p className="text-[8px] text-muted-foreground/40 uppercase tracking-widest">Sincronizando métricas em tempo real</p>
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
                <Target className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Intelligence Hub</span>
            </div>
            <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic">
              Dashboard <span className="text-primary tracking-normal font-light not-italic">Geral</span>
            </h1>
            <p className="text-muted-foreground font-medium text-sm mt-1 opacity-70 italic">Indicadores estratégicos de performance e fluxo industrial.</p>
          </div>
          <div className="flex items-center gap-4 bg-neutral-900/50 border border-white/5 rounded-2xl px-6 py-3 shadow-inner">
            <Calendar className="h-5 w-5 text-primary" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Data de Hoje</span>
              <span className="text-sm font-black text-white">{new Date().toLocaleDateString("pt-BR", { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* Premium Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.name} className="glass-card group hover:border-primary/50 transition-all duration-500 relative overflow-hidden bg-neutral-900/40">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center justify-between mb-6">
                <div className={`rounded-2xl bg-white/5 p-4 ${stat.color} group-hover:bg-primary group-hover:text-white transition-all shadow-inner border border-white/5`}>
                  <stat.icon className="h-7 w-7" />
                </div>
                <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 text-muted-foreground/20 group-hover:text-primary transition-colors">
                  <ArrowUpRight className="h-5 w-5" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{stat.name}</p>
                <p className="text-4xl font-black text-white tracking-tighter">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-10 lg:grid-cols-3">
          {/* Main Feed Section */}
          <div className="lg:col-span-2 space-y-10">
            {/* Timeline View */}
            <div className="glass-card border-white/5 bg-neutral-900/20">
              <div className="mb-10 flex items-center justify-between px-2">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                    <Activity className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Atividade Transacional</h2>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-60">Fluxo de movimentações recentes</p>
                  </div>
                </div>
                <Link href="/inventory" className="p-3 px-6 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-primary hover:text-white hover:bg-neutral-800 transition-all flex items-center gap-3 group/link shadow-sm">
                  Ver Tudo
                  <ArrowRight className="h-3 w-3 group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </div>

              <div className="space-y-6 relative ml-6 border-l-2 border-primary/10 pb-4">
                {recentActivity.length > 0 ? recentActivity.map((item) => (
                  <div key={item.id} className="relative pl-12 group">
                    <div className="absolute -left-[1.35rem] top-1 h-10 w-10 rounded-2xl bg-neutral-900 border-2 border-primary/30 flex items-center justify-center group-hover:border-primary group-hover:scale-105 transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                      <Zap className="h-4 w-4 text-primary group-hover:animate-pulse" />
                    </div>
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-5 group-hover:border-primary/20 group-hover:bg-white/[0.07] transition-all relative">
                      <div className="flex items-start justify-between mb-2">
                        <div className="space-y-1">
                          <p className="font-black text-white text-lg tracking-tight leading-none group-hover:text-primary transition-colors">
                            {item.products?.brand} {item.products?.model}
                          </p>
                          <p className="text-[9px] font-mono text-muted-foreground uppercase font-black tracking-widest">Equipamento: {item.products?.internal_serial}</p>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-black text-white bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 mb-1">
                            {item.new_status}
                          </span>
                          <span className="text-[9px] font-mono text-muted-foreground opacity-50 font-black tracking-tighter">
                            {new Date(item.created_at).toLocaleTimeString("pt-BR")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-16 opacity-30 italic text-sm text-white">Nenhum fluxo transacional registrado até o momento.</div>
                )}
              </div>
            </div>

            {/* Performance Chart Simulation (SVG) */}
            <div className="glass-card overflow-hidden bg-neutral-900/40 relative">
              <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                <TrendingUp className="h-32 w-32 text-primary" />
              </div>
              <div className="mb-8 flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20"><TrendingUp className="h-5 w-5" /></div>
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tighter leading-none mb-1">Análise de Rendimento</h2>
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-60">Volumetria de processamento diário</p>
                </div>
              </div>
              <div className="h-40 w-full flex items-end gap-2 px-4 pb-2">
                {[35, 45, 30, 55, 40, 70, 45, 60, 85, 50, 65, 75].map((val, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-primary/10 rounded-t-lg hover:bg-primary/40 transition-all cursor-pointer group relative active:scale-95"
                    style={{ height: `${val}%` }}
                  >
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-black px-3 py-1 rounded-xl text-[10px] font-black opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap shadow-xl scale-90 group-hover:scale-100">
                      {val} ATIVOS
                    </div>
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-between px-4 text-[9px] text-muted-foreground font-black uppercase tracking-[0.3em] opacity-40">
                <span>Turno A (Matinal)</span>
                <span>Turno B (Vespertino)</span>
                <span>Turno C (Noturno)</span>
              </div>
            </div>
          </div>

          {/* Right Sidebar - KPI's */}
          <div className="space-y-6">
            <div className="glass-card border-primary/20 bg-gradient-to-br from-primary/10 to-neutral-950 p-8 shadow-2xl relative overflow-hidden group">
              <div className="absolute -top-8 -right-8 h-24 w-24 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all" />
              <div className="mb-8 flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary shadow-inner rotate-3"><Zap className="h-5 w-5" /></div>
                <h2 className="text-xl font-black text-white uppercase tracking-tighter">OEE Score</h2>
              </div>
              <div className="space-y-6">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">Média Lead Time</p>
                    <p className="text-5xl font-black text-white tracking-widest">{leadTime.avg}</p>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase border border-emerald-500/20 mb-1">
                    {leadTime.status}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden p-0.5 border border-white/5">
                    <div className="h-full w-[85%] bg-gradient-to-r from-primary to-blue-600 rounded-full shadow-[0_0_20px_rgba(14,165,233,0.8)] relative">
                      <div className="absolute inset-0 bg-white/20 animate-pulse" />
                    </div>
                  </div>
                  <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-50">
                    <span>Eficiência Operacional</span>
                    <span>85% Pico</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card bg-neutral-900/50 border-dashed border-white/10 space-y-6 p-8">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 italic">Workflows Rápidos</h2>
              <div className="grid gap-3">
                {[
                  { name: "Executar Scan", href: "/scan", icon: Zap, active: true },
                  { name: "Sincronizar CRM", href: "/clients", icon: User, active: false },
                  { name: "Gestão Pedidos", href: "/orders", icon: Package, active: false },
                ].map(link => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/5 hover:border-primary/50 hover:bg-primary/[0.03] group transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center transition-all", link.active ? "bg-primary/20 text-primary" : "bg-white/5 text-muted-foreground group-hover:text-white")}>
                        <link.icon className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-black uppercase text-white tracking-widest group-hover:text-primary transition-colors">{link.name}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </Link>
                ))}
              </div>
              <p className="text-[9px] text-center text-muted-foreground/30 font-black uppercase tracking-tighter italic">V. 2.0.4 - INDUSTRIAL EDGE</p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
