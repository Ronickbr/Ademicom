// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { JWT } from "npm:google-auth-library";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();
    if (!image) {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const saBase64 = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_B64");
    if (!saBase64) {
      throw new Error("GOOGLE_SERVICE_ACCOUNT_B64 secret is not set");
    }
    const saJson = new TextDecoder().decode(Uint8Array.from(atob(saBase64), c => c.charCodeAt(0)));
    const serviceAccount = JSON.parse(saJson);

    // Get Auth Client
    const client = new JWT({
      email: serviceAccount.client_email,
      key: serviceAccount.private_key,
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });

    const token = await client.getAccessToken();
    const accessToken = token.token;

    const base64Data = image.split(",")[1] || image;

    const response = await fetch(
      "https://vision.googleapis.com/v1/images:annotate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          requests: [
            {
              image: { content: base64Data },
              features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Vision API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const fullText = data.responses?.[0]?.fullTextAnnotation?.text || "";

    if (!fullText) {
      return new Response(JSON.stringify({ error: "No text detected" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parser implementation
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
    const getValueAfter = (text: string, label: string) => {
      const uText = text.toUpperCase();
      const uLabel = label.toUpperCase();
      const index = uText.indexOf(uLabel);
      if (index === -1) return null;
      let val = text.substring(index + label.length).trim();
      return val.replace(/^[:\-\s]+/, '').split('\n')[0].trim() || null;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toUpperCase();
      if (line.includes("MODELO")) result.modelo = getValueAfter(lines[i], "MODELO") || lines[i + 1]?.trim();
      if (line.includes("CODIGO COMERCIAL") || line.includes("CÓDIGO COMERCIAL")) result.codigo_comercial = getValueAfter(lines[i], "CODIGO COMERCIAL") || lines[i + 1]?.trim();
      if (line.includes("COR")) result.cor = getValueAfter(lines[i], "COR");
      if (line.includes("PNC/ML")) result.pnc_ml = getValueAfter(lines[i], "PNC/ML") || lines[i + 1]?.trim();
      if (line.includes("N. DE SERIE") || line.includes("N.DE SERIE")) result.numero_serie = getValueAfter(lines[i], "N. DE SERIE") || lines[i + 1]?.trim();
      if (line.includes("DATA FABRICACAO") || line.includes("DATA FABRICAÇÃO")) result.data_fabricacao = getValueAfter(lines[i], "DATA FABRICACAO") || lines[i + 1]?.trim();
      if (line.includes("GAS FRIGOR") || line.includes("GÁS FRIGOR")) result.gas_refrigerante = getValueAfter(lines[i], "GAS FRIGOR") || lines[i + 1]?.trim();
      if (line.includes("VOL. TOTAL")) result.volume_total = getValueAfter(lines[i], "VOL. TOTAL") || lines[i + 1]?.trim();
      if (line.includes("TENSAO") || line.includes("TENSÃO")) result.tensao = getValueAfter(lines[i], "TENSAO") || lines[i + 1]?.trim();
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
