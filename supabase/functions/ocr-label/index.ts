
// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();

    // Validate request
    if (!image) {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const VISION_API_KEY = Deno.env.get("VISION_API_KEY");
    if (!VISION_API_KEY) {
      console.error("VISION_API_KEY is not set");
      return new Response(
        JSON.stringify({ error: "Server configuration error: VISION_API_KEY missing" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prepare image for Vision API (remove data:image/jpeg;base64, prefix)
    const base64Data = image.split(",")[1] || image;

    // Call Google Cloud Vision API
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${VISION_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: base64Data,
              },
              features: [
                {
                  type: "DOCUMENT_TEXT_DETECTION",
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Vision API Error [${response.status}]:`, errorText);
      return new Response(
        JSON.stringify({ error: `Vision API Error: ${response.status}`, details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const fullText = data.responses?.[0]?.fullTextAnnotation?.text || "";

    console.log("Full Text detected:", fullText);

    if (!fullText) {
      return new Response(
        JSON.stringify({ error: "No text detected in the image" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Advanced Parser for Electrolux Labels
    const result = {
      fabricante: "Electrolux",
      modelo: null,
      codigo_comercial: null,
      cor: null,
      pnc_ml: null,
      numero_serie: null,
      data_fabricacao: null,
      gas_refrigerante: null,
      volume_total: null,
      tensao: null,
    };

    const lines = fullText.split('\n');

    // Helper to extract value after a label
    const getValueAfter = (text: string, label: string, useNextLineIfEmpty = true) => {
      const index = text.toUpperCase().indexOf(label.toUpperCase());
      if (index === -1) return null;

      let value = text.substring(index + label.length).trim();
      // Remove trailing characters like ":", "-", etc.
      value = value.replace(/^[:\-\s]+/, '').split('\n')[0].trim();

      if (!value && useNextLineIfEmpty) {
        // Check next line in full text logic... easier with lines array
        return null;
      }
      return value || null;
    };

    // Improved parsing logic using lines and keywords
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toUpperCase();

      if (line.includes("MODELO")) {
        result.modelo = lines[i + 1]?.trim() || getValueAfter(lines[i], "MODELO");
      }
      if (line.includes("CODIGO COMERCIAL") || line.includes("CÓDIGO COMERCIAL")) {
        result.codigo_comercial = lines[i + 1]?.trim() || getValueAfter(lines[i], "CODIGO COMERCIAL");
      }
      if (line.includes("COR")) {
        result.cor = getValueAfter(lines[i], "COR");
      }
      if (line.includes("PNC/ML")) {
        result.pnc_ml = lines[i + 1]?.trim() || getValueAfter(lines[i], "PNC/ML");
      }
      if (line.includes("N. DE SERIE") || line.includes("N.DE SERIE")) {
        result.numero_serie = lines[i + 1]?.trim() || getValueAfter(lines[i], "N. DE SERIE");
      }
      if (line.includes("DATA FABRICACAO") || line.includes("DATA FABRICAÇÃO")) {
        result.data_fabricacao = getValueAfter(lines[i], "DATA FABRICACAO") || lines[i + 1]?.trim();
      }
      if (line.includes("GAS FRIGOR") || line.includes("GÁS FRIGOR")) {
        result.gas_refrigerante = getValueAfter(lines[i], "GAS FRIGOR") || lines[i + 1]?.trim();
      }
      if (line.includes("VOL. TOTAL")) {
        result.volume_total = getValueAfter(lines[i], "VOL. TOTAL") || lines[i + 1]?.trim();
      }
      if (line.includes("TENSAO") || line.includes("TENSÃO")) {
        result.tensao = getValueAfter(lines[i], "TENSAO") || lines[i + 1]?.trim();
      }
    }

    // Final cleanup of values
    Object.keys(result).forEach(key => {
      if (result[key]) {
        // Cut at first major line break or irrelevant word
        result[key] = result[key].split('  ')[0].trim();
      }
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Critical Function Error:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
