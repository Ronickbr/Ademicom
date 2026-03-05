import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('ERRO CRÍTICO: Variáveis de ambiente do Supabase não encontradas.');
  console.info('Certifique-se de que o arquivo .env existe na raiz do projeto com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      // Custom lock to avoid Navigator LockManager timeouts in some environments
      lock: async (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => {
        // Bypass lock manager and execute immediately
        // This avoids the 10s timeout if the lock is stuck
        return await fn();
      }
    }
  }
);
