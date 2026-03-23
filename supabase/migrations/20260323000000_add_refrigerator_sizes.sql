-- Migration to add size column to products and configuration in settings

-- Add size column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS size TEXT;

-- Insert default settings for refrigerator sizes
INSERT INTO system_settings (key, value, description)
VALUES (
    'refrigerator_sizes', 
    '{"small_max": 300, "medium_max": 550}', 
    'Configuração de limites de volume (em Litros) para classificação de tamanho dos refrigeradores'
)
ON CONFLICT (key) DO NOTHING;
