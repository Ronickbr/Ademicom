// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

Deno.serve(async (req: Request) => {
    const { email, password, fullName, role } = await req.json()

    // 1. Check for Service Role Key
    const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )

    // 2. Create User in Auth
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, role: role }
    })

    if (userError) {
        return new Response(JSON.stringify({ error: userError.message }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        })
    }

    return new Response(JSON.stringify({ data: userData }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    })
})
