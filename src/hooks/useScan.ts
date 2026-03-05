import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { offlineQueue } from '@/lib/offline-queue'
import { toast } from 'sonner'
import { Product } from '@/lib/types'
import { logger } from '@/lib/logger'
import { generateNextInternalSerial } from '@/lib/id-generator'
import Tesseract from 'tesseract.js'
import { parseElectroluxLabel } from '@/lib/ocr-parser'

const SCAN_COOLDOWN = 3000

export function useScan() {
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

  const scanImage = async (imageSrc: string) => {
    setOcrLoading(true)
    try {
      // OCR local usando Tesseract.js (Sem custo de API)
      const { data: { text } } = await Tesseract.recognize(
        imageSrc,
        'por', // Português
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              // Log progress if needed
            }
          }
        }
      )

      if (text) {
        const parsedData = parseElectroluxLabel(text)
        setOcrResult(parsedData)
        toast.success("Etiqueta analisada com sucesso!")
        return parsedData
      } else {
        toast.warning("Nenhum texto identificado na imagem.")
        return null
      }
    } catch (error) {
      console.error("OCR Local Error:", error)
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
          status: 'CADASTRO',
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
    isProcessing,
    lastScans,
    isOnline,
    ocrResult,
    ocrLoading,
    scanImage,
    setOcrResult,
    notFound,
    setNotFound,
    registerProduct
  }
}
