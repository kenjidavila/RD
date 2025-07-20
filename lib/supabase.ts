// ARCHIVO EXCLUSIVO PARA CLIENTE - NO IMPORTA LÓGICA DE SERVIDOR
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

// EXPORTACIÓN REQUERIDA PARA COMPATIBILIDAD
export function createServerClient() {
  throw new Error("createServerClient should not be used in client-side code. Use createClient() instead.")
}

// Instancia singleton para uso directo en componentes cliente

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
  user_id: string
  rnc: string
  razon_social: string
  nombre_comercial?: string
  email?: string
  email_contacto?: string
  telefono?: string
  direccion?: string
  provincia?: string
  municipio?: string
  sector?: string
  tipo_contribuyente?: string
  regimen_tributario?: string
  actividad_economica?: string
  website?: string
  observaciones?: string
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

// Named export for compatibility - REQUIRED FOR DEPLOYMENT
export const supabase = createClient()
