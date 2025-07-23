import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/database"

// Cliente para uso exclusivo en el navegador (client-side)
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables")
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}

// Instancia singleton para uso directo en componentes cliente

// Función para validar configuración del cliente
export function validateClientConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const errors: string[] = []

  if (!url) {
    errors.push("NEXT_PUBLIC_SUPABASE_URL is not configured")
  } else if (!url.startsWith("https://")) {
    errors.push("NEXT_PUBLIC_SUPABASE_URL must start with https://")
  }

  if (!anonKey) {
    errors.push("NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured")
  } else if (anonKey.length < 100) {
    errors.push("NEXT_PUBLIC_SUPABASE_ANON_KEY appears to be invalid (too short)")
  }

  return {
    valid: errors.length === 0,
    errors,
    config: {
      url,
      anonKey: anonKey ? `${anonKey.substring(0, 10)}...` : "Not set",
    },
  }
}

// Singleton para cliente del navegador
let clientInstance: ReturnType<typeof createClient> | null = null

export function getClient() {
  if (typeof window === "undefined") {
    throw new Error("getClient can only be used in client components")
  }

  if (!clientInstance) {
    clientInstance = createClient()
  }
  return clientInstance
}

// Función para limpiar la instancia (útil para testing)
export function clearClientInstance() {
  clientInstance = null
}

// Tipos para las tablas principales - SOLO PARA CLIENTE
export interface Usuario {
  id: string
  empresa_id: string
  rnc_cedula: string
  nombre: string
  email: string
  rol: "administrador" | "firmante" | "aprobador_comercial" | "solicitante"
  activo: boolean
  created_at: string
  updated_at: string
}

export interface Empresa {
  id: string
  rnc: string
  razon_social: string
  nombre_comercial?: string
  email?: string
  telefono?: string
  direccion?: string
  provincia?: string
  municipio?: string
  activa: boolean
  created_at: string
  updated_at: string
}

export interface Cliente {
  id: string
  empresa_id: string
  rnc_cedula: string
  nombre: string
  email?: string
  telefono?: string
  direccion?: string
  tipo: "persona_fisica" | "persona_juridica"
  activo: boolean
  created_at: string
  updated_at: string
}

export interface Item {
  id: string
  empresa_id: string
  codigo: string
  descripcion: string
  precio: number
  unidad_medida: string
  tipo_impuesto: string
  tasa_impuesto: number
  activo: boolean
  created_at: string
  updated_at: string
}

export interface CertificadoDigital {
  id: string
  empresa_id: string
  nombre: string
  archivo_url: string
  fecha_vencimiento: string
  activo: boolean
  created_at: string
  updated_at: string
}

export interface Configuracion {
  id: string
  empresa_id: string
  clave: string
  valor: string
  tipo: "string" | "number" | "boolean" | "json"
  descripcion?: string
  created_at: string
  updated_at: string
}

export interface Borrador {
  id: string
  empresa_id: string
  usuario_id: string
  tipo_comprobante: string
  datos: any
  nombre: string
  created_at: string
  updated_at: string
}

// Función de utilidad para verificar configuración - SOLO CLIENTE
export const verifySupabaseConfig = (): { valid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    errors.push("NEXT_PUBLIC_SUPABASE_URL is missing")
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    errors.push("NEXT_PUBLIC_SUPABASE_ANON_KEY is missing")
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// Cliente para el lado del cliente (browser) - Usa anon key y respeta RLS
export const createClientSideClient = () => {
  return createClient()
}

// Cliente por defecto para uso general en el cliente
export const supabaseClient = () => createClient()
