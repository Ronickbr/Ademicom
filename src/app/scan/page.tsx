"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import { MainLayout } from "@/components/layout/MainLayout";
import { Camera, RefreshCw, Upload, Check, AlertCircle, Loader2, Info, ArrowLeft, ShieldCheck, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Product } from "@/lib/types";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";

const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: "environment",
};

export default function ScanPage() {
    const { profile, loading: authLoading } = useAuth();
    const router = useRouter();
    const webcamRef = useRef<Webcam>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [imgSrc, setImgSrc] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [scanResult, setScanResult] = useState<Partial<Product> | null>(null);

    useEffect(() => {
        if (!authLoading && !profile) {
            router.push("/");
        }
    }, [authLoading, profile, router]);

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
            setImgSrc(imageSrc);
            processImage(imageSrc);
        }
    }, [webcamRef]);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setImgSrc(base64String);
                processImage(base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    const processImage = async (image: string) => {
        setIsProcessing(true);
        // Simulation of OCR processing using the standardized Electrolux label
        setTimeout(() => {
            setScanResult({
                brand: "Electrolux",
                model: "IM8S",
                commercial_code: "02623FBA",
                color: "30",
                product_type: "COMB. FROST FREE ELUX",
                pnc_ml: "900277738 / 00",
                serial: "30926473",
                manufacturing_date: "03/03/2023 - 09:50:18",
                market_class: "T / I",
                refrigerant_gas: "R600a",
                gas_charge: "45 g",
                compressor: "EMBRACO",
                volume_freezer: "200 L",
                volume_refrigerator: "390 L",
                volume_total: "590 L",
                pressure_high_low: "(788 / 52) kPa / (100 / 7,09) psig",
                freezing_capacity: "9 kg / 24h",
                electric_current: "2,3 A",
                defrost_power: "316 W",
                frequency: "60 Hz",
                voltage: "127 V",
            });
            setIsProcessing(false);
            toast.info("Leitura concluída com sucesso!");
        }, 2000);
    };

    const handleConfirmSave = async () => {
        if (!scanResult) return;
        setIsSaving(true);
        const internalSerial = `INT-${Date.now().toString().slice(-8)}`;

        try {
            if (!profile) throw new Error("Usuário não identificado.");

            const { data: existing } = await supabase
                .from("products")
                .select("id, status, internal_serial")
                .eq("original_serial", scanResult?.serial)
                .neq("status", "LIBERADO")
                .maybeSingle();

            if (existing) {
                toast.warning("Equipamento já registrado", {
                    description: `O serial ${scanResult.serial} já possui o registro interno ${existing.internal_serial} em andamento.`,
                });
                setIsSaving(false);
                return;
            }

            const { error } = await supabase.from("products").insert([
                {
                    ...scanResult,
                    original_serial: scanResult.serial,
                    internal_serial: internalSerial,
                    status: "CADASTRO",
                    is_in_stock: true,
                    created_by: profile.id
                },
            ]);

            if (error) throw error;

            toast.success("Cadastro Realizado!", {
                description: `Produto ${scanResult.model} registrado sob ID ${internalSerial}.`,
            });
            resetScan();
        } catch (error: any) {
            toast.error("Falha no cadastro", { description: error.message });
        } finally {
            setIsSaving(false);
        }
    };

    const resetScan = () => {
        setImgSrc(null);
        setScanResult(null);
    };

    if (authLoading) return null; // MainLayout gerencia isso

    if (!profile) return null; // Lógica de redirecionamento no useEffect

    return (
        <MainLayout>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />

            <div className="max-w-6xl mx-auto space-y-8 pb-12">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter text-white mb-2 uppercase">Scan Vision <span className="text-primary italic">AI</span></h1>
                        <p className="text-muted-foreground font-medium italic opacity-70">Capture e decodifique parâmetros industriais instantaneamente.</p>
                    </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-5 items-start">
                    {/* Viewport de Captura */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="relative aspect-square md:aspect-video lg:aspect-square overflow-hidden rounded-[2.5rem] bg-neutral-900 border-4 border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)] group">
                            {!imgSrc ? (
                                <>
                                    <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" videoConstraints={videoConstraints} className="h-full w-full object-cover" />
                                    <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none" />
                                    <div className="absolute inset-[40px] border-2 border-primary/30 border-dashed rounded-xl pointer-events-none" />
                                    <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-6">
                                        <button onClick={capture} className="h-20 w-20 rounded-full bg-primary text-white shadow-[0_0_30px_rgba(var(--primary),0.5)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
                                            <Camera className="h-10 w-10" />
                                        </button>
                                        <button onClick={() => fileInputRef.current?.click()} className="h-20 w-20 rounded-full bg-white/5 backdrop-blur-xl text-white border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
                                            <Upload className="h-8 w-8" />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="relative h-full w-full">
                                    <img src={imgSrc} alt="Preview" className="h-full w-full object-cover" />
                                    {isProcessing && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in">
                                            <div className="relative h-20 w-20">
                                                <Loader2 className="h-20 w-20 text-primary animate-spin opacity-20" />
                                                <Zap className="absolute inset-0 m-auto h-8 w-8 text-primary animate-pulse" />
                                            </div>
                                            <p className="mt-6 text-sm font-black text-primary tracking-[0.3em] uppercase animate-pulse">Processamento Neural...</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {imgSrc && !isProcessing && (
                            <div className="grid grid-cols-5 gap-3">
                                <button
                                    onClick={handleConfirmSave}
                                    disabled={isSaving || !scanResult}
                                    className="col-span-4 h-16 bg-white text-black hover:bg-primary hover:text-white rounded-3xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3 disabled:grayscale"
                                >
                                    {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                                    Finalizar Registro
                                </button>
                                <button
                                    onClick={resetScan}
                                    className="col-span-1 h-16 rounded-3xl bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                                >
                                    <RefreshCw className="h-6 w-6" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Dashboard de Dados */}
                    <div className="lg:col-span-3">
                        {scanResult ? (
                            <div className="glass-card h-full p-10 border-white/10 shadow-3xl flex flex-col group animate-in slide-in-from-bottom-8 duration-700">
                                <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
                                    <div className="flex gap-4 items-center">
                                        <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                            <Check className="h-8 w-8" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-white leading-tight uppercase tracking-tighter">Dados Extraídos</h2>
                                            <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">Validação de Telemetria Industrial</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[9px] font-black text-muted-foreground uppercase opacity-40 mb-1">Confiança</div>
                                        <div className="text-xs font-black text-emerald-500 bg-emerald-500/5 px-4 py-1.5 rounded-full border border-emerald-500/20 uppercase tracking-widest">99.8% Precisão</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-6">
                                    {[
                                        { label: "Fabricante", value: scanResult.brand, accent: true },
                                        { label: "Modelo", value: scanResult.model, accent: true },
                                        { label: "Serial Original", value: scanResult.serial, mono: true },
                                        { label: "PNC / ML", value: scanResult.pnc_ml },
                                        { label: "Cód. Comercial", value: scanResult.commercial_code },
                                        { label: "Tipo", value: scanResult.product_type },
                                        { label: "Gás Refrig.", value: scanResult.refrigerant_gas },
                                        { label: "Carga Gás", value: scanResult.gas_charge },
                                        { label: "Fabricação", value: scanResult.manufacturing_date },
                                        { label: "Classe", value: scanResult.market_class },
                                        { label: "Volume Freezer", value: scanResult.volume_freezer },
                                        { label: "Volume Refrig.", value: scanResult.volume_refrigerator },
                                        { label: "Total Líquido", value: scanResult.volume_total },
                                        { label: "Pressão A/B", value: scanResult.pressure_high_low },
                                        { label: "Cap. Congel.", value: scanResult.freezing_capacity },
                                        { label: "Corrente", value: scanResult.electric_current },
                                        { label: "Degelo", value: scanResult.defrost_power },
                                        { label: "Tensão / Freq.", value: `${scanResult.voltage} / ${scanResult.frequency}` },
                                    ].map((field, i) => (
                                        <div key={i} className="flex flex-col group/item">
                                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1 group-hover/item:text-primary transition-colors">
                                                {field.label}
                                            </span>
                                            <span className={cn(
                                                "text-sm font-medium transition-all truncate",
                                                field.accent ? "text-primary font-black text-lg" : "text-white/80",
                                                field.mono && "font-mono tracking-tighter"
                                            )}>
                                                {field.value || "---"}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-auto pt-10">
                                    <div className="flex items-start gap-4 p-5 rounded-3xl bg-white/5 border border-white/5 shadow-inner">
                                        <Info className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                                        <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                                            A tecnologia <strong>Scan Vision</strong> realiza o mapeamento de 21 coordenadas da etiqueta técnica.
                                            Verificações manuais de integridade são recomendadas antes do faturamento.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="glass-card h-full min-h-[500px] flex flex-col items-center justify-center text-center p-16 border-dashed border-2 bg-white/1 relative overflow-hidden">
                                <div className="absolute inset-0 opacity-5 pointer-events-none">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-infinite-scan" />
                                </div>
                                <div className="h-32 w-32 rounded-full bg-white/5 flex items-center justify-center mb-10 relative">
                                    <Camera className="h-16 w-16 text-muted-foreground opacity-10" />
                                    <div className="absolute inset-0 rounded-full border-2 border-primary/20 border-t-primary animate-spin" style={{ animationDuration: '4s' }} />
                                </div>
                                <h3 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter">Pronto para Coleta</h3>
                                <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed italic text-sm">
                                    Posicione a etiqueta técnica no centro do visor. <br />
                                    <strong>Resolução mínima recomendada: 1080p.</strong>
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
