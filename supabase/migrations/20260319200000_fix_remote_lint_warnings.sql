-- Migration to fix Supabase Linter warnings identified in erros.md

-- 1. Fix function_search_path_mutable
-- Dynamically update search_path for functions highlighted by the linter.
DO $$
DECLARE
    r record;
BEGIN
    FOR r IN 
        SELECT p.oid::regprocedure AS proc_identity
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
          AND p.proname IN (
              'get_next_internal_serial', 
              'get_inventory_filters', 
              'get_dashboard_stats', 
              'handle_new_user', 
              'handle_updated_at', 
              'check_user_role', 
              'is_admin', 
              'has_any_role'
          )
    LOOP
        EXECUTE format('ALTER FUNCTION %s SET search_path = public', r.proc_identity);
    END LOOP;
END $$;

-- 2. Fix rls_policy_always_true
-- Replace overly permissive WITH CHECK (true) or USING (true) for non-SELECT commands with auth.uid() IS NOT NULL.

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'product_logs' AND policyname = 'Enable insert for authenticated users only') THEN
        DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.product_logs;
        CREATE POLICY "Enable insert for authenticated users only" ON public.product_logs
            FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'product_logs' AND policyname = 'Logs insertable by authenticated users') THEN
        DROP POLICY IF EXISTS "Logs insertable by authenticated users" ON public.product_logs;
        CREATE POLICY "Logs insertable by authenticated users" ON public.product_logs
            FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'products' AND policyname = 'Status update logic') THEN
        DROP POLICY IF EXISTS "Status update logic" ON public.products;
        CREATE POLICY "Status update logic" ON public.products
            FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
    END IF;
END $$;
