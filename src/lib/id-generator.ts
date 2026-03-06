import { supabase } from './supabase';

export async function generateNextInternalSerial(): Promise<string> {
    try {
        const currentYear = new Date().getFullYear();

        // 1. Fetch the manual sequence start from settings
        const { data: settingsData } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'ambicom_sequence_start')
            .maybeSingle();

        const manualStart = settingsData?.value ? parseInt(settingsData.value as string) : 1;

        // 2. Fetch the last product to get the current sequence for the current year
        // The format is now 00000-YYYY
        const { data, error } = await supabase
            .from('products')
            .select('internal_serial')
            .not('internal_serial', 'is', null)
            .ilike('internal_serial', `%- ${currentYear}`)
            .order('internal_serial', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) throw error;

        let nextNumber = manualStart;

        if (data?.internal_serial) {
            const parts = data.internal_serial.split('-');
            if (parts.length === 2) {
                const lastNum = parseInt(parts[0]); // First part is the counter now
                if (!isNaN(lastNum)) {
                    // Start from the higher of (lastNum + 1) OR manualStart
                    nextNumber = Math.max(lastNum + 1, manualStart);
                }
            }
        }

        return `${nextNumber.toString().padStart(5, '0')}-${currentYear}`;
    } catch (error) {
        console.error('Error generating internal serial:', error);
        const currentYear = new Date().getFullYear();
        // Fallback to error format if DB fails to avoid blocking
        return `99999-${currentYear}`;
    }
}
