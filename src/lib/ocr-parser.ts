export interface OCRMetadata {
    fabricante: string;
    modelo: string | null;
    codigo_comercial: string | null;
    cor: string | null;
    pnc_ml: string | null;
    numero_serie: string | null;
    data_fabricacao: string | null;
    gas_refrigerante: string | null;
    volume_total: string | null;
    tensao: string | null;
}

export function parseElectroluxLabel(fullText: string): OCRMetadata {
    const result: OCRMetadata = {
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
        // Remove symbols and get the first line of the value
        return val.replace(/^[:\-\s]+/, '').split('\n')[0].trim() || null;
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toUpperCase();

        // Modelo
        if (line.includes("MODELO")) {
            result.modelo = getValueAfter(lines[i], "MODELO") || lines[i + 1]?.trim();
        }

        // Código Comercial
        if (line.includes("CODIGO COMERCIAL") || line.includes("CÓDIGO COMERCIAL")) {
            result.codigo_comercial = getValueAfter(lines[i], "CODIGO COMERCIAL") || getValueAfter(lines[i], "CÓDIGO COMERCIAL") || lines[i + 1]?.trim();
        }

        // Cor
        if (line.includes("COR")) {
            result.cor = getValueAfter(lines[i], "COR");
        }

        // PNC/ML
        if (line.includes("PNC/ML")) {
            result.pnc_ml = getValueAfter(lines[i], "PNC/ML") || lines[i + 1]?.trim();
        }

        // Número de Série
        if (line.includes("N. DE SERIE") || line.includes("N.DE SERIE") || line.includes("SERIE")) {
            result.numero_serie = getValueAfter(lines[i], "N. DE SERIE") || getValueAfter(lines[i], "N.DE SERIE") || getValueAfter(lines[i], "SERIE") || lines[i + 1]?.trim();
        }

        // Data Fabricação
        if (line.includes("DATA FABRICACAO") || line.includes("DATA FABRICAÇÃO")) {
            result.data_fabricacao = getValueAfter(lines[i], "DATA FABRICACAO") || getValueAfter(lines[i], "DATA FABRICAÇÃO") || lines[i + 1]?.trim();
        }

        // Gás Refrigerante
        if (line.includes("GAS FRIGOR") || line.includes("GÁS FRIGOR") || line.includes("REFRIGERANTE")) {
            result.gas_refrigerante = getValueAfter(lines[i], "GAS FRIGOR") || getValueAfter(lines[i], "GÁS FRIGOR") || getValueAfter(lines[i], "REFRIGERANTE") || lines[i + 1]?.trim();
        }

        // Volume Total
        if (line.includes("VOL. TOTAL") || line.includes("VOLUME TOTAL")) {
            result.volume_total = getValueAfter(lines[i], "VOL. TOTAL") || getValueAfter(lines[i], "VOLUME TOTAL") || lines[i + 1]?.trim();
        }

        // Tensão
        if (line.includes("TENSAO") || line.includes("TENSÃO") || line.includes("VOLTAGEM")) {
            result.tensao = getValueAfter(lines[i], "TENSAO") || getValueAfter(lines[i], "TENSÃO") || getValueAfter(lines[i], "VOLTAGEM") || lines[i + 1]?.trim();
        }
    }

    return result;
}
