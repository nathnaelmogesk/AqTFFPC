
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with service role key
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

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Verify the user is authenticated and is an admin
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      throw new Error('Admin access required')
    }

    const { name, email, phone, address, role, temporaryPassword } = await req.json()

    // Create the user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        name,
        phone,
        address,
        role
      }
    })

    if (createError) {
      throw createError
    }

    // Create or update the profile with the role and other details
    const { error: profileUpsertError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: newUser.user.id,
        name,
        phone,
        address,
        role
      })

    if (profileUpsertError) {
      console.error('Profile upsert error:', profileUpsertError)
      throw profileUpsertError
    }

    // If the role is supplier, create a supplier record
    if (role === 'supplier') {
      const { error: supplierError } = await supabaseAdmin
        .from('suppliers')
        .upsert({
          id: newUser.user.id,
          name,
          contact_name: name,
          phone: phone || '',
          email,
          address: address || '',
          business_registration_number: `REG-${Date.now()}`, // Generate a temporary registration number
          is_active: true
        })

      if (supplierError) {
        console.error('Supplier creation error:', supplierError)
        // Don't throw here as the user is already created, just log the error
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: {
          id: newUser.user.id,
          email: newUser.user.email,
          name,
          role
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error creating user:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to create user' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
