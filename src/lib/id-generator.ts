import { supabase } from './supabase';

export async function generateNextInternalSerial(): Promise<string> {
    try {
        // 1. Fetch the manual sequence start from settings
        const { data: settingsData } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'ambicom_sequence_start')
            .maybeSingle();

        const manualStart = settingsData?.value ? parseInt(settingsData.value as string) : 1;

        // 2. Fetch the last product to get the current sequence
        const { data, error } = await supabase
            .from('products')
            .select('internal_serial')
            .not('internal_serial', 'is', null)
            .ilike('internal_serial', 'AMB-%')
            .order('internal_serial', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) throw error;

        let nextNumber = manualStart;

        if (data?.internal_serial) {
            const parts = data.internal_serial.split('-');
            if (parts.length === 2) {
                const lastNum = parseInt(parts[1]);
                if (!isNaN(lastNum)) {
                    // Start from the higher of (lastNum + 1) OR manualStart
                    nextNumber = Math.max(lastNum + 1, manualStart);
                }
            }
        }

        return `AMB-${nextNumber.toString().padStart(4, '0')}`;
    } catch (error) {
        console.error('Error generating internal serial:', error);
        // Fallback to timestamp if DB fails to avoid blocking
        return `AMB-TMP-${Date.now().toString().slice(-4)}`;
    }
}
