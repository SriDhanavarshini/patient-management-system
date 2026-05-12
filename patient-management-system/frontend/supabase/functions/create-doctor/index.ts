// supabase/functions/create-doctor/index.ts
// Deploy with: npx supabase functions deploy create-doctor

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // ── 1. Verify the caller is an authenticated admin ──────────────────
    // The frontend sends its session token in the Authorization header.
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing authorization header.')

    // Create a client with the caller's JWT to check their identity
    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await callerClient.auth.getUser()
    if (userError || !user) throw new Error('Unauthorized: could not verify session.')

    // Check caller exists in public.admins
    const { data: adminRow, error: adminError } = await callerClient
      .from('admins')
      .select('id')
      .eq('id', user.id)
      .single()

    if (adminError || !adminRow) throw new Error('Unauthorized: caller is not an admin.')

    // ── 2. Parse the request body ────────────────────────────────────────
    const { password, ...doctorData } = await req.json()
    if (!doctorData.email || !password) throw new Error('email and password are required.')

    // ── 3. Create auth user using the service role client ───────────────
    // Service role key is only available server-side in Edge Function env vars.
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: doctorData.email,
      password,
      email_confirm: true,
    })

    if (authError) throw new Error(`Auth error: ${authError.message}`)

    const doctorUserId = authData.user.id

    // ── 4. Insert into public.doctors ────────────────────────────────────
    const { data: insertData, error: insertError } = await adminClient
      .from('doctors')
      .insert({
        user_id: doctorUserId,
        name:             doctorData.name,
        email:            doctorData.email,
        phone:            doctorData.phone            || null,
        specialization:   doctorData.specialization   || null,
        gender:           doctorData.gender           || null,
        date_of_birth:    doctorData.date_of_birth    || null,
        qualification:    doctorData.qualification    || null,
        experience_years: doctorData.experience_years ? parseInt(doctorData.experience_years) : null,
        license_number:   doctorData.license_number   || null,
        address:          doctorData.address          || null,
        city:             doctorData.city             || null,
        state:            doctorData.state            || null,
        pincode:          doctorData.pincode          || null,
        shift_start:      doctorData.shift_start      || null,
        shift_end:        doctorData.shift_end        || null,
      })
      .select()

    if (insertError) {
      // Clean up orphaned auth user if DB insert fails
      await adminClient.auth.admin.deleteUser(doctorUserId)
      throw new Error(`Insert error: ${insertError.message}`)
    }

    return new Response(
      JSON.stringify({ data: insertData[0] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (err) {
    console.error('create-doctor edge function error:', err.message)
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})