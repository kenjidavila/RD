import { createClient } from "@/utils/supabase/client"
import type { Database } from "@/types/database"

// Servicios específicos para componentes cliente
export class SupabaseClientService {
  private client: ReturnType<typeof createClient>

  constructor() {
    this.client = createClient()
  }

  // Autenticación
  async signIn(email: string, password: string) {
    return await this.client.auth.signInWithPassword({ email, password })
  }

  async signUp(email: string, password: string, metadata?: Record<string, any>) {
    return await this.client.auth.signUp({
      email,
      password,
      options: { data: metadata },
    })
  }

  async signOut() {
    return await this.client.auth.signOut()
  }

  async getSession() {
    return await this.client.auth.getSession()
  }

  async getUser() {
    return await this.client.auth.getUser()
  }

  // Operaciones de base de datos (respeta RLS)
  async getEmpresas() {
    return await this.client.from("empresas").select("*").eq("activa", true)
  }

  async getClientes(empresaId: string) {
    return await this.client.from("clientes").select("*").eq("empresa_id", empresaId).eq("activo", true)
  }

  async getItems(empresaId: string) {
    return await this.client.from("items").select("*").eq("empresa_id", empresaId).eq("activo", true)
  }

  async getConfiguraciones(empresaId: string) {
    return await this.client.from("configuraciones").select("*").eq("empresa_id", empresaId)
  }

  async getBorradores(empresaId: string) {
    return await this.client
      .from("borradores")
      .select("*")
      .eq("empresa_id", empresaId)
      .order("updated_at", { ascending: false })
  }

  async getCertificadosDigitales(empresaId: string) {
    return await this.client.from("certificados_digitales").select("*").eq("empresa_id", empresaId).eq("activo", true)
  }

  // Catálogos DGII
  async getDgiiCatalogoMonedas() {
    return await this.client.from("dgii_catalogo_monedas").select("*")
  }

  async getDgiiCatalogoUnidadesMedida() {
    return await this.client.from("dgii_catalogo_unidades_medida").select("*")
  }

  async getDgiiCatalogoTiposImpuestos() {
    return await this.client.from("dgii_catalogo_tipos_impuestos").select("*")
  }

  async getDgiiCatalogoProvinciasMunicipios() {
    return await this.client.from("dgii_catalogo_provincias_municipios").select("*")
  }

  // Suscripciones en tiempo real
  subscribeToTable<T extends keyof Database["public"]["Tables"]>(
    table: T,
    callback: (payload: any) => void,
    filter?: string,
  ) {
    let subscription = this.client.channel(`${table}_changes`)

    if (filter) {
      subscription = subscription.on("postgres_changes", { event: "*", schema: "public", table, filter }, callback)
    } else {
      subscription = subscription.on("postgres_changes", { event: "*", schema: "public", table }, callback)
    }

    return subscription.subscribe()
  }

  // Cleanup
  removeAllChannels() {
    return this.client.removeAllChannels()
  }
}

// Instancia singleton para uso en componentes
export function getSupabaseClientService() {
  return new SupabaseClientService()
}

// Hooks personalizados para React
export function useSupabaseClient() {
  return createClient()
}

// Función para verificar si el usuario está autenticado
export async function checkAuth() {
  const client = createClient()
  const {
    data: { session },
  } = await client.auth.getSession()
  return session
}

// Función para obtener el usuario actual
export async function getCurrentUser() {
  const client = createClient()
  const {
    data: { user },
  } = await client.auth.getUser()
  return user
}
