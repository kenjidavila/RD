import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "@/types/database"

// Cliente para uso exclusivo en Server Components y API Routes del App Router
export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables")
  }

  const cookieStore = await cookies()

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}

// Cliente administrativo para operaciones que requieren service role
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase admin environment variables")
  }

  return createServerClient<Database>(supabaseUrl, supabaseServiceKey, {
    cookies: {
      getAll() {
        return []
      },
      setAll() {
        // No-op for admin client
      },
    },
  })
}

// Función para validar configuración del servidor
export function validateServerConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  const errors: string[] = []

  if (!url) {
    errors.push("NEXT_PUBLIC_SUPABASE_URL is not configured")
  }

  if (!anonKey) {
    errors.push("NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured")
  }

  if (!serviceKey) {
    errors.push("SUPABASE_SERVICE_ROLE_KEY is not configured")
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// Obtener el RNC asociado al usuario autenticado
export async function getUserRnc(
  supabase: ReturnType<typeof createClient>,
): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Buscar empresa vinculada directamente al usuario
  const { data: empresaDirecta } = await supabase
    .from("empresas")
    .select("rnc")
    .eq("user_id", user.id)
    .maybeSingle()

  if (empresaDirecta?.rnc) return empresaDirecta.rnc

  // Buscar a través de la tabla de usuarios
  const { data: usuario } = await supabase
    .from("usuarios")
    .select("empresa_id")
    .eq("auth_user_id", user.id)
    .maybeSingle()

  if (usuario?.empresa_id) {
    const { data: empresa } = await supabase
      .from("empresas")
      .select("rnc")
      .eq("id", usuario.empresa_id)
      .maybeSingle()

    if (empresa?.rnc) return empresa.rnc
  }

  return null
}
