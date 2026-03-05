import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { offlineQueue } from '@/lib/offline-queue'
import { toast } from 'sonner'
import { Product } from '@/lib/types'
import { logger } from '@/lib/logger'
import { generateNextInternalSerial } from '@/lib/id-generator'

const SCAN_COOLDOWN = 3000

export function useScan() {
  const [scannedCode, setScannedCode] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastScans, setLastScans] = useState<Product[]>([])
  const [lastScanTime, setLastScanTime] = useState(0)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  // OCR States
  const [ocrResult, setOcrResult] = useState<Record<string, any> | null>(null)
  const [ocrLoading, setOcrLoading] = useState(false)
  const [notFound, setNotFound] = useState<string | null>(null)

  // Sync logic
  useEffect(() => {
    const processSync = () => {
      if (navigator.onLine) {
        offlineQueue.processQueue(async (item) => {
          if (item.type === 'scan') {
            try {
              const { data } = await supabase
                .from("products")
                .select("*")
                .or(`internal_serial.eq.${item.code.toUpperCase()},original_serial.eq.${item.code.toUpperCase()}`)
                .maybeSingle()

              if (data) {
                setLastScans(prev => {
                  const filtered = prev.filter(p => p.internal_serial !== item.code)
                  return [data, ...filtered].slice(0, 5)
                })
                toast.success(`Item sincronizado: ${item.code}`)
              } else {
                toast.warning(`Item não encontrado no banco: ${item.code}`)
              }
            } catch (e) {
              logger.error("Sync error in useScan", e)
              throw e // Re-throw to keep in queue
            }
          }
        })
      }
    }

    const handleOnline = () => {
      setIsOnline(true)
      toast.success("Conexão restabelecida. Sincronizando dados...")
      processSync()
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast.warning("Você está offline. Scans serão salvos localmente.")
    }

    // Check sync on mount
    processSync()

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const processCode = async (code: string) => {
    const now = Date.now()
    if (now - lastScanTime < SCAN_COOLDOWN || isProcessing) return

    setLastScanTime(now)
    setIsProcessing(true)
    setScannedCode(code)
    logger.info("Processing scan code", { code })

    if (!navigator.onLine) {
      offlineQueue.add({
        code,
        type: 'scan'
      })

      // Placeholder product
      const offlineProduct = {
        id: `offline-${Date.now()}`,
        internal_serial: `OFF-AMB-${Math.floor(Math.random() * 1000)}`,
        model: code,
        status: 'EM AVALIAÇÃO',
        created_at: new Date().toISOString(),
        is_in_stock: false,
        brand: null,
        original_serial: null,
        commercial_code: null,
        color: null,
        product_type: null,
        pnc_ml: null,
        manufacturing_date: null,
        market_class: null,
        refrigerant_gas: null,
        gas_charge: null,
        compressor: null,
        volume_freezer: null,
        volume_refrigerator: null,
        volume_total: null,
        pressure_high_low: null,
        freezing_capacity: null,
        electric_current: null,
        defrost_power: null,
        frequency: null,
        voltage: null,
        photo_product: null,
        photo_model: null,
        photo_serial: null,
        updated_at: new Date().toISOString(),
        created_by: null
      } as unknown as Product

      setLastScans(prev => [offlineProduct, ...prev].slice(0, 5))
      setIsProcessing(false)
      setTimeout(() => setScannedCode(null), 2000)
      return
    }

    try {
      const { data: existingProduct, error: fetchError } = await supabase
        .from("products")
        .select("*")
        .or(`internal_serial.eq.${code.toUpperCase()},original_serial.eq.${code.toUpperCase()}`)
        .maybeSingle()

      if (fetchError) throw fetchError

      if (!existingProduct) {
        setNotFound(code.toUpperCase())
        toast.info("Produto não localizado", {
          description: "Deseja realizar o cadastro inicial deste ativo?"
        })
        return
      }

      setNotFound(null)

      toast.info("Produto identificado", {
        description: `Modelo: ${existingProduct.model} - Status: ${existingProduct.status}`
      })
      setLastScans(prev => [existingProduct, ...prev].slice(0, 5))
    } catch (error) {
      const err = error as Error
      console.error("Erro ao processar código:", err)
      toast.error("Erro ao processar", { description: err.message })
    } finally {
      setIsProcessing(false)
      setTimeout(() => setScannedCode(null), 2000)
    }
  }

  const scanImage = async (imageSrc: string) => {
    if (!navigator.onLine) {
      toast.error("Modo Offline", {
        description: "O OCR requer internet. Utilize a entrada manual ou aguarde a conexão."
      })
      return null
    }

    setOcrLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('ocr-label', {
        body: { image: imageSrc }
      })

      if (error) throw error

      if (data) {
        setOcrResult(data)
        toast.success("Etiqueta analisada com sucesso!")
        return data
      } else {
        toast.warning("Nenhum dado identificado na imagem.")
        return null
      }
    } catch (error) {
      console.error("OCR Error:", error)
      toast.error("Erro na leitura da etiqueta", {
        description: "Verifique a iluminação e o foco."
      })
      return null
    } finally {
      setOcrLoading(false)
    }
  }

  const registerProduct = async (data: Partial<Product>, base64Photos?: Record<string, string | null>) => {
    setIsProcessing(true)
    try {
      const internalSerial = await generateNextInternalSerial()
      const photoUrls: Record<string, string | null> = {
        photo_product: null,
        photo_model: null,
        photo_serial: null,
        photo_defect: null
      }

      // Upload photos if provided
      if (base64Photos && isOnline) {
        for (const [key, base64] of Object.entries(base64Photos)) {
          if (base64) {
            const fileName = `${internalSerial}/${key}_${Date.now()}.jpg`;
            const blob = await fetch(base64).then(res => res.blob());
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('product-photos')
              .upload(fileName, blob, { contentType: 'image/jpeg' });

            if (uploadError) {
              logger.error(`Error uploading ${key}`, uploadError);
            } else if (uploadData) {
              const { data: { publicUrl } } = supabase.storage
                .from('product-photos')
                .getPublicUrl(fileName);
              photoUrls[key] = publicUrl;
            }
          }
        }
      }

      const { data: newProduct, error } = await supabase
        .from("products")
        .insert({
          ...data,
          ...photoUrls,
          internal_serial: internalSerial,
          status: 'EM AVALIAÇÃO',
          is_in_stock: true,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single()

      if (error) throw error

      toast.success("Produto registrado com sucesso!", {
        description: `ID Interno: ${internalSerial}`
      })

      setLastScans(prev => [newProduct, ...prev].slice(0, 5))
      setNotFound(null)
      setOcrResult(null)
      return newProduct
    } catch (error) {
      const err = error as Error
      logger.error("Error registering product", err)
      toast.error("Erro ao cadastrar", { description: err.message })
      return null
    } finally {
      setIsProcessing(false)
    }
  }

  return {
    scannedCode,
    isProcessing,
    lastScans,
    isOnline,
    processCode,
    setScannedCode,
    ocrResult,
    ocrLoading,
    scanImage,
    setOcrResult,
    notFound,
    setNotFound,
    registerProduct
  }
}
