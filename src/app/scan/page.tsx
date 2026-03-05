import React, { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import Webcam from "react-webcam";
import { supabase } from "@/lib/supabase";
import {
    ScanLine,
    Loader2,
    CheckCircle,
    Camera,
    RefreshCw,
    FileText,
    Wifi,
    WifiOff,
    Barcode,
    ArrowRight,
    History as HistoryIcon,
    ChevronRight,
    X,
    Upload
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/AuthProvider";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useScan } from "@/hooks/useScan";
import { logger } from "@/lib/logger";

export default function ScanPage() {
    const { profile, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const webcamRef = React.useRef<Webcam>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [manualCode, setManualCode] = useState("");
    const [videoConstraints, setVideoConstraints] = useState<MediaTrackConstraints | boolean>({
        facingMode: "environment"
    });
    const [cameraError, setCameraError] = useState(false);
    const [uploadType, setUploadType] = useState<'product' | 'model' | 'serial' | 'defect' | null>(null);

    // OCR States
    const [showOcrModal, setShowOcrModal] = useState(false);

    // Photos States
    const [photos, setPhotos] = useState<{
        product: string | null;
        model: string | null;
        serial: string | null;
        defect: string | null;
    }>({
        product: null,
        model: null,
        serial: null,
        defect: null
    });

    // Custom Hook
    const {
        scannedCode,
        isProcessing,
        lastScans,
        isOnline,
        processCode,
        ocrResult,
        ocrLoading,
        scanImage,
        notFound,
        setNotFound,
        registerProduct
    } = useScan();

    useEffect(() => {
        if (!authLoading && !profile) {
            navigate("/login");
        }
    }, [authLoading, profile, navigate]);

    const handleCameraError = (err: string | DOMException) => {
        logger.error("Camera access error", err);

        // If "environment" camera not found, fallback to any camera
        if (typeof videoConstraints !== 'boolean' && videoConstraints.facingMode === 'environment') {
            logger.info("Environment camera not found, falling back to default camera");
            setVideoConstraints(true); // Basic true means "any video source"
            return;
        }

        setCameraError(true);
    };

    // OCR Handler
    const handleOCRScan = async () => {
        if (!webcamRef.current) return;
        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) return;

        const data = await scanImage(imageSrc);
        if (data) {
            setShowOcrModal(true);
        }
    };

    const capturePhoto = (type: 'product' | 'model' | 'serial' | 'defect') => {
        if (!webcamRef.current) return;
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
            setPhotos(prev => ({ ...prev, [type]: imageSrc }));
            const label = type === 'product' ? 'Produto' : type === 'model' ? 'Modelo' : type === 'serial' ? 'Série' : 'Avaria';
            toast.success(`Foto do ${label} capturada!`);
        }
    };

    const handleFileUpload = (type: 'product' | 'model' | 'serial' | 'defect') => {
        setUploadType(type);
        fileInputRef.current?.click();
    };

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && uploadType) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setPhotos(prev => ({ ...prev, [uploadType]: base64String }));
                const label = uploadType === 'product' ? 'Produto' : uploadType === 'model' ? 'Modelo' : uploadType === 'serial' ? 'Série' : 'Avaria';
                toast.success(`Foto do ${label} carregada!`);
                setUploadType(null);
            };
            reader.readAsDataURL(file);
        }
    };

    // Simulation of barcode reading (click on video)
    const handleSimulateScan = () => {
        const mockCode = `AMB-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
        processCode(mockCode);
    };

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (manualCode) {
            processCode(manualCode);
            setManualCode("");
        }
    };

    if (authLoading) return null;

    return (
        <MainLayout>
            <div className="max-w-6xl mx-auto space-y-10 pb-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                <ScanLine className="h-4 w-4" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Aquisição de Dados</span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white uppercase italic">Terminal de <span className="text-primary not-italic font-light">Leitura</span></h1>
                        <p className="text-muted-foreground font-medium text-sm mt-1 opacity-70 italic">Digitalização e entrada de ativos no fluxo industrial.</p>
                    </div>
                    <div className="glass-card flex items-center gap-4 py-4 px-8 border-white/5 bg-neutral-900/50 shadow-inner w-full md:w-auto justify-between md:justify-start">
                        <div className={cn("h-10 w-10 rounded-full flex items-center justify-center border shadow-sm", isOnline ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-red-500/10 text-red-500 border-red-500/20")}>
                            {isOnline ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
                        </div>
                        <div>
                            <div className="text-[9px] uppercase font-black text-muted-foreground tracking-widest leading-none mb-1">Status do Scanner</div>
                            <div className="text-lg font-black text-white italic tracking-widest">
                                {isOnline ? "ONLINE" : "OFFLINE"}
                                <span className={cn("text-[10px] not-italic font-medium opacity-50 ml-2", isOnline ? "text-emerald-500" : "text-red-500")}>
                                    {isOnline ? "Conectado" : "Salvando Local"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-5 gap-8">
                    <div className="lg:col-span-3 space-y-6">
                        {/* Camera Frame */}
                        <div className="glass-card p-2 border-white/10 bg-black shadow-2xl relative overflow-hidden group">
                            <div className="relative aspect-square md:aspect-video rounded-xl overflow-hidden bg-neutral-900 border border-white/5">
                                {!cameraError ? (
                                    <>
                                        <Webcam
                                            ref={webcamRef}
                                            audio={false}
                                            screenshotFormat="image/jpeg"
                                            videoConstraints={videoConstraints}
                                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                            onUserMediaError={handleCameraError}
                                            onUserMedia={() => logger.info("Camera access granted")}
                                            onClick={handleSimulateScan} // Simulação de clique para scan
                                        />
                                        {/* Overlay de Scan */}
                                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                            <div className="w-64 h-40 border-2 border-primary/50 rounded-lg relative animate-pulse shadow-[0_0_50px_rgba(14,165,233,0.2)]">
                                                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary" />
                                                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary" />
                                                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary" />
                                                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary" />
                                                {/* Laser Line */}
                                                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-[scan_2s_ease-in-out_infinite]" />
                                            </div>
                                        </div>

                                        {/* OCR & Capture Controls */}
                                        <div className="absolute bottom-4 left-4 right-4 z-20 flex gap-2 justify-center">
                                            <div className="flex flex-col gap-2">
                                                <button
                                                    onClick={() => capturePhoto('product')}
                                                    className={cn(
                                                        "px-3 py-2 backdrop-blur-md border rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95",
                                                        photos.product ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" : "bg-black/60 border-white/20 text-white hover:border-primary/50"
                                                    )}
                                                >
                                                    <Camera className="h-3.5 w-3.5" />
                                                    PRODUTO
                                                </button>
                                                <button
                                                    onClick={() => handleFileUpload('product')}
                                                    className="px-3 py-1.5 backdrop-blur-md border border-white/10 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-2 bg-white/5 text-white/70 hover:bg-white/10"
                                                >
                                                    <Upload className="h-3 w-3" />
                                                    SUBIR
                                                </button>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <button
                                                    onClick={() => capturePhoto('model')}
                                                    className={cn(
                                                        "px-3 py-2 backdrop-blur-md border rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95",
                                                        photos.model ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" : "bg-black/60 border-white/20 text-white hover:border-primary/50"
                                                    )}
                                                >
                                                    <Camera className="h-3.5 w-3.5" />
                                                    MODELO
                                                </button>
                                                <button
                                                    onClick={() => handleFileUpload('model')}
                                                    className="px-3 py-1.5 backdrop-blur-md border border-white/10 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-2 bg-white/5 text-white/70 hover:bg-white/10"
                                                >
                                                    <Upload className="h-3 w-3" />
                                                    SUBIR
                                                </button>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <button
                                                    onClick={() => capturePhoto('serial')}
                                                    className={cn(
                                                        "px-3 py-2 backdrop-blur-md border rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95",
                                                        photos.serial ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" : "bg-black/60 border-white/20 text-white hover:border-primary/50"
                                                    )}
                                                >
                                                    <Camera className="h-3.5 w-3.5" />
                                                    SÉRIE
                                                </button>
                                                <button
                                                    onClick={() => handleFileUpload('serial')}
                                                    className="px-3 py-1.5 backdrop-blur-md border border-white/10 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-2 bg-white/5 text-white/70 hover:bg-white/10"
                                                >
                                                    <Upload className="h-3 w-3" />
                                                    SUBIR
                                                </button>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <button
                                                    onClick={() => capturePhoto('defect')}
                                                    className={cn(
                                                        "px-3 py-2 backdrop-blur-md border rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95",
                                                        photos.defect ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" : "bg-black/60 border-white/20 text-white hover:border-primary/50"
                                                    )}
                                                >
                                                    <Camera className="h-3.5 w-3.5" />
                                                    AVARIA
                                                </button>
                                                <button
                                                    onClick={() => handleFileUpload('defect')}
                                                    className="px-3 py-1.5 backdrop-blur-md border border-white/10 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-2 bg-white/5 text-white/70 hover:bg-white/10"
                                                >
                                                    <Upload className="h-3 w-3" />
                                                    SUBIR
                                                </button>
                                            </div>
                                            <button
                                                onClick={handleOCRScan}
                                                disabled={ocrLoading}
                                                className="px-3 py-2 bg-primary/20 hover:bg-primary/40 backdrop-blur-md border border-primary/50 rounded-xl text-primary text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 ml-2"
                                            >
                                                {ocrLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                                                OCR
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
                                        <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-2">
                                            <Camera className="h-8 w-8" />
                                        </div>
                                        <h3 className="text-xl font-black text-white uppercase tracking-tight">Câmera Indisponível</h3>
                                        <p className="text-sm text-muted-foreground max-w-xs mx-auto">Verifique as permissões do navegador ou utilize a entrada manual abaixo.</p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setCameraError(false)}
                                                className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all border border-white/5 flex items-center gap-2"
                                            >
                                                <RefreshCw className="h-3 w-3" />
                                                Tentar Novamente
                                            </button>
                                            <div className="flex gap-1">
                                                {(['product', 'model', 'serial', 'defect'] as const).map(t => (
                                                    <button
                                                        key={t}
                                                        onClick={() => handleFileUpload(t)}
                                                        className={cn(
                                                            "px-3 py-3 border rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all",
                                                            photos[t] ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                                                        )}
                                                        title={`Subir foto de ${t}`}
                                                    >
                                                        <Upload className="h-3.5 w-3.5" />
                                                        {t === 'product' ? 'PROD' : t === 'model' ? 'MOD' : t === 'serial' ? 'SER' : 'AVAR'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {scannedCode && (
                                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-20 animate-in fade-in zoom-in duration-300">
                                        <div className="text-center space-y-4">
                                            <div className="h-20 w-20 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 mx-auto border-2 border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                                                <CheckCircle className="h-10 w-10" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-1">Código Capturado</p>
                                                <p className="text-3xl font-black text-white tracking-widest font-mono">{scannedCode}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Manual Input */}
                        <div className="glass-card p-6 border-white/5 bg-neutral-900/30">
                            <form onSubmit={handleManualSubmit} className="flex gap-4">
                                <div className="relative flex-1 group">
                                    <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="text"
                                        value={manualCode}
                                        onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                                        placeholder="Digitar código manualmente..."
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 h-16 text-lg font-mono text-white placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all shadow-inner uppercase tracking-wider"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={!manualCode || isProcessing}
                                    className="px-8 h-16 bg-white text-black hover:bg-primary hover:text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 shadow-lg disabled:opacity-50 disabled:grayscale flex items-center gap-2 group/btn"
                                >
                                    {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5 group-hover/btn:translate-x-1 transition-transform" />}
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                        <div className="glass-card bg-neutral-900/50 border-white/5 h-full flex flex-col p-8 relative overflow-hidden">
                            <div className="flex items-center gap-3 mb-8">
                                <HistoryIcon className="h-5 w-5 text-primary" />
                                <h2 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Registro de Sessão</h2>
                            </div>

                            <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                                {lastScans.length > 0 ? lastScans.map((product, index) => (
                                    <div key={index} className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-primary/30 transition-all group animate-in slide-in-from-right-4 fade-in duration-500" style={{ animationDelay: `${index * 100}ms` }}>
                                        <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground group-hover:text-white group-hover:bg-primary/20 transition-all font-mono text-xs font-bold border border-white/5">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-white text-sm truncate">{product.internal_serial}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={cn(
                                                    "h-1.5 w-1.5 rounded-full",
                                                    product.status === "CADASTRO" ? "bg-yellow-500" : "bg-emerald-500"
                                                )} />
                                                <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">{product.status}</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                    </div>
                                )) : (
                                    <div className="flex flex-col items-center justify-center h-40 text-center space-y-3 opacity-30">
                                        <HistoryIcon className="h-8 w-8 text-muted-foreground" />
                                        <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Nenhuma leitura recente</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 pt-6 border-t border-white/5 text-center">
                                <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold opacity-40">
                                    Total Sessão: {lastScans.length} Ativos
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* NotFound Modal (Registro de itens manuais/barcode não localizados) */}
            {notFound && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl space-y-6 p-8 relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
                        <div className="text-center space-y-2">
                            <div className="h-16 w-16 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 mx-auto border border-amber-500/20 mb-4">
                                <Barcode className="h-8 w-8" />
                            </div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">Ativo não Identificado</h3>
                            <p className="text-sm text-muted-foreground italic">O código <span className="text-white font-mono font-bold">{notFound}</span> não consta na base de dados.</p>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => {
                                    registerProduct({ original_serial: notFound });
                                }}
                                className="h-14 bg-white text-black hover:bg-primary hover:text-white rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-3 shadow-lg"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Cadastrar Novo Ativo
                            </button>
                            <button
                                onClick={() => setNotFound(null)}
                                className="h-12 text-muted-foreground hover:text-white font-black text-[10px] uppercase transition-all tracking-widest"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* OCR Modal */}
            {showOcrModal && ocrResult && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 border border-purple-500/20">
                                    <FileText className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-white uppercase tracking-tight">Dados Extraídos</h3>
                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Análise de etiqueta via IA</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowOcrModal(false)}
                                className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-white transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="p-6 space-y-3 overflow-y-auto custom-scrollbar flex-1">
                            {Object.entries(ocrResult).map(([key, value]) => (
                                <div key={key} className="flex flex-col gap-1 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                                    <span className="text-[9px] uppercase font-black tracking-widest text-muted-foreground">{key.replace(/_/g, ' ')}</span>
                                    <span className="text-sm font-medium text-white font-mono break-all">{String(value || 'N/A')}</span>
                                </div>
                            ))}
                        </div>

                        <div className="p-6 border-t border-white/5 bg-white/5 flex gap-3 shrink-0">
                            <button
                                onClick={() => setShowOcrModal(false)}
                                className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-black uppercase tracking-widest text-[10px] transition-all border border-white/5"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={async () => {
                                    if (!photos.product || !photos.model || !photos.serial || !photos.defect) {
                                        toast.error("As 4 fotos são obrigatórias (Ambiente, Modelo, Série, Avaria)");
                                        return;
                                    }

                                    const capturedPhotos = {
                                        photo_product: photos.product,
                                        photo_model: photos.model,
                                        photo_serial: photos.serial,
                                        photo_defect: photos.defect,
                                    };

                                    const data = {
                                        brand: ocrResult.fabricante as string,
                                        model: ocrResult.modelo as string,
                                        original_serial: ocrResult.numero_serie as string,
                                        commercial_code: ocrResult.codigo_comercial as string,
                                        refrigerant_gas: ocrResult.gas_refrigerante as string,
                                        volume_total: ocrResult.volume_total as string,
                                        voltage: ocrResult.tensao as string,
                                    };

                                    await registerProduct(data, capturedPhotos);
                                    setShowOcrModal(false);
                                }}
                                className="flex-1 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20"
                            >
                                <CheckCircle className="h-4 w-4" />
                                Confirmar e Cadastrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Inputs de Arquivo Ocultos */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={onFileChange}
            />
        </MainLayout>
    );
}
