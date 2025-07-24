import { supabase } from "./supabase"
import provinciasFallback from "@/public/data/provincias.json"

export interface Provincia {
  codigo: string
  nombre: string
  activa: boolean
}

export interface Municipio {
  codigo: string
  provincia_codigo: string
  nombre: string
  activa: boolean
}

export interface UnidadMedida {
  codigo: string
  nombre: string
  activa: boolean
}

export interface TipoImpuestoAdicional {
  codigo: string
  nombre: string
  tipo: "especifico" | "ad_valorem"
  activa: boolean
}

export interface TipoMoneda {
  codigo: string
  nombre: string
  activa: boolean
}

export class DGIICatalogsService {
  // Provincias
  static async getProvincias(): Promise<Provincia[]> {
    const { data, error } = await supabase
      .from("provincias")
      .select("*")
      .eq("activa", true)
      .order("nombre")

    if (error || !data || data.length === 0) {
      if (error) {
        console.error("Error fetching provincias:", error)
      }
      // Fallback a datos estáticos cuando la consulta falla o no retorna datos
      return provinciasFallback as Provincia[]
    }

    return data
  }

  static async getProvinciaByCode(codigo: string): Promise<Provincia | null> {
    const { data, error } = await supabase
      .from("provincias")
      .select("*")
      .eq("codigo", codigo)
      .eq("activa", true)
      .single()

    if (error) {
      console.error("Error fetching provincia:", error)
      return null
    }

    return data
  }

  // Municipios
  static async getMunicipios(): Promise<Municipio[]> {
    const { data, error } = await supabase.from("municipios").select("*").eq("activa", true).order("nombre")

    if (error) {
      console.error("Error fetching municipios:", error)
      return []
    }

    return data || []
  }

  static async getMunicipiosByProvincia(provinciaCodigo: string): Promise<Municipio[]> {
    const { data, error } = await supabase
      .from("municipios")
      .select("*")
      .eq("provincia_codigo", provinciaCodigo)
      .eq("activa", true)
      .order("nombre")

    if (error) {
      console.error("Error fetching municipios by provincia:", error)
      return []
    }

    return data || []
  }

  static async getMunicipioByCode(codigo: string): Promise<Municipio | null> {
    const { data, error } = await supabase
      .from("municipios")
      .select("*")
      .eq("codigo", codigo)
      .eq("activa", true)
      .single()

    if (error) {
      console.error("Error fetching municipio:", error)
      return null
    }

    return data
  }

  // Unidades de medida
  static async getUnidadesMedida(): Promise<UnidadMedida[]> {
    const { data, error } = await supabase.from("unidades_medida").select("*").eq("activa", true).order("nombre")

    if (error) {
      console.error("Error fetching unidades medida:", error)
      return []
    }

    return data || []
  }

  static async getUnidadMedidaByCode(codigo: string): Promise<UnidadMedida | null> {
    const { data, error } = await supabase
      .from("unidades_medida")
      .select("*")
      .eq("codigo", codigo)
      .eq("activa", true)
      .single()

    if (error) {
      console.error("Error fetching unidad medida:", error)
      return null
    }

    return data
  }

  // Tipos de impuestos adicionales
  static async getTiposImpuestosAdicionales(): Promise<TipoImpuestoAdicional[]> {
    const { data, error } = await supabase
      .from("tipos_impuestos_adicionales")
      .select("*")
      .eq("activa", true)
      .order("nombre")

    if (error) {
      console.error("Error fetching tipos impuestos adicionales:", error)
      return []
    }

    return data || []
  }

  static async getTipoImpuestoAdicionalByCode(codigo: string): Promise<TipoImpuestoAdicional | null> {
    const { data, error } = await supabase
      .from("tipos_impuestos_adicionales")
      .select("*")
      .eq("codigo", codigo)
      .eq("activa", true)
      .single()

    if (error) {
      console.error("Error fetching tipo impuesto adicional:", error)
      return null
    }

    return data
  }

  // Tipos de monedas
  static async getTiposMonedas(): Promise<TipoMoneda[]> {
    const { data, error } = await supabase.from("tipos_monedas").select("*").eq("activa", true).order("nombre")

    if (error) {
      console.error("Error fetching tipos monedas:", error)
      return []
    }

    return data || []
  }

  static async getTipoMonedaByCode(codigo: string): Promise<TipoMoneda | null> {
    const { data, error } = await supabase
      .from("tipos_monedas")
      .select("*")
      .eq("codigo", codigo)
      .eq("activa", true)
      .single()

    if (error) {
      console.error("Error fetching tipo moneda:", error)
      return null
    }

    return data
  }

  // Validaciones
  static validateProvinciaCode(codigo: string): boolean {
    return /^[0-9]{6}$/.test(codigo)
  }

  static validateMunicipioCode(codigo: string): boolean {
    return /^[0-9]{6}$/.test(codigo)
  }

  static validateUnidadMedidaCode(codigo: string): boolean {
    return /^[0-9]{1,2}$/.test(codigo)
  }

  static validateTipoImpuestoAdicionalCode(codigo: string): boolean {
    return /^[0-9]{3}$/.test(codigo)
  }

  static validateTipoMonedaCode(codigo: string): boolean {
    return /^[A-Z]{3}$/.test(codigo)
  }

  static validateRNC(rnc: string): boolean {
    return /^[0-9]{9,11}$/.test(rnc.replace(/[-\s]/g, ""))
  }

  static validateCedula(cedula: string): boolean {
    return /^[0-9]{11}$/.test(cedula.replace(/[-\s]/g, ""))
  }

  static validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  static validatePhone(phone: string): boolean {
    return /^[0-9\-\s+$$$$]{7,15}$/.test(phone)
  }
}
