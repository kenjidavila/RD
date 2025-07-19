import { createServerClient } from "@supabase/ssr"
import type { Database } from "@/types/database"

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

// Función para validar configuración administrativa
export function validateAdminConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  const errors: string[] = []

  if (!url) {
    errors.push("NEXT_PUBLIC_SUPABASE_URL is not configured")
  }

  if (!serviceKey) {
    errors.push("SUPABASE_SERVICE_ROLE_KEY is not configured")
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// Operaciones administrativas comunes
export class SupabaseAdmin {
  private client: ReturnType<typeof createAdminClient>

  constructor() {
    this.client = createAdminClient()
  }

  // Crear usuario con bypass de RLS
  async createUser(userData: {
    email: string
    password: string
    user_metadata?: Record<string, any>
  }) {
    return await this.client.auth.admin.createUser(userData)
  }

  // Eliminar usuario con bypass de RLS
  async deleteUser(userId: string) {
    return await this.client.auth.admin.deleteUser(userId)
  }

  // Obtener todos los usuarios (admin only)
  async getAllUsers() {
    return await this.client.auth.admin.listUsers()
  }

  // Operaciones de base de datos con bypass de RLS
  async queryWithoutRLS<T>(
    table: string,
    query: (client: ReturnType<typeof createAdminClient>) => Promise<T>,
  ): Promise<T> {
    return await query(this.client)
  }
}
