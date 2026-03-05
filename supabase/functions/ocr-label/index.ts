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

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not set");
      return new Response(
        JSON.stringify({ error: "Server configuration error: OPENAI_API_KEY missing" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call OpenAI Vision API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Using mini for speed/cost efficiency
        messages: [
          {
            role: "system",
            content: `Você é um especialista em extração de dados de etiquetas industriais (OCR inteligente).
            Analise a imagem da etiqueta e extraia as seguintes informações em formato JSON estrito:
            - fabricante (string)
            - modelo (string)
            - codigo_comercial (string)
            - numero_serie (string)
            - gas_refrigerante (string)
            - volume_total (string)
            - tensao (string)
            
            Retorne APENAS o JSON, sem markdown ou explicações adicionais. Se um campo não for encontrado, retorne null.`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analise esta etiqueta e extraia os dados.",
              },
              {
                type: "image_url",
                image_url: {
                  url: image, // base64 data url expected
                },
              },
            ],
          },
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("OpenAI API error:", errorData);
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    // Clean up response if it contains markdown code blocks
    const jsonStr = content.replace(/```json\n?|```/g, "").trim();
    
    // Attempt to parse JSON
    let result;
    try {
      result = JSON.parse(jsonStr);
    } catch (e: unknown) {
      console.error("JSON parse error:", e);
      // Fallback: try to extract JSON from text if it's mixed with other text
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Failed to parse AI response as JSON");
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error processing request:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
