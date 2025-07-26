import { supabase } from "./supabase"
import provinciasFallback from "@/public/data/provincias.json"
import municipiosFallback from "@/public/data/municipios.json"

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
      .from("dgii_catalogo_provincias_municipios")
      .select("codigo_provincia, nombre_provincia")
      .order("nombre_provincia")

    if (error || !data || data.length === 0) {
      if (error) {
        console.error("Error fetching provincias:", error)
      }
      // Fallback a datos estáticos cuando la consulta falla o no retorna datos
      return provinciasFallback as Provincia[]
    }

    const provinciasMap = new Map<string, Provincia>()
    for (const p of data) {
      provinciasMap.set(p.codigo_provincia, {
        codigo: p.codigo_provincia,
        nombre: p.nombre_provincia,
        activa: true,
      })
    }
    return Array.from(provinciasMap.values())
  }

  static async getProvinciaByCode(codigo: string): Promise<Provincia | null> {
    const { data, error } = await supabase
      .from("dgii_catalogo_provincias_municipios")
      .select("codigo_provincia, nombre_provincia")
      .eq("codigo_provincia", codigo)
      .order("nombre_provincia")
      .maybeSingle()

    if (error) {
      console.error("Error fetching provincia:", error)
      return null
    }

    if (!data) return null
    return {
      codigo: data.codigo_provincia,
      nombre: data.nombre_provincia,
      activa: true,
    }
  }

  // Municipios
  static async getMunicipios(): Promise<Municipio[]> {
    const { data, error } = await supabase
      .from("dgii_catalogo_provincias_municipios")
      .select("codigo_municipio, codigo_provincia, nombre_municipio")
      .order("nombre_municipio")

    if (error || !data || data.length === 0) {
      if (error) {
        console.error("Error fetching municipios:", error)
      }
      return municipiosFallback as Municipio[]
    }

    return data.map((m) => ({
      codigo: m.codigo_municipio,
      provincia_codigo: m.codigo_provincia,
      nombre: m.nombre_municipio,
      activa: true,
    }))
  }

  static async getMunicipiosByProvincia(provinciaCodigo: string): Promise<Municipio[]> {
    const { data, error } = await supabase
      .from("dgii_catalogo_provincias_municipios")
      .select("codigo_municipio, codigo_provincia, nombre_municipio")
      .eq("codigo_provincia", provinciaCodigo)
      .order("nombre_municipio")

    if (error || !data || data.length === 0) {
      if (error) {
        console.error("Error fetching municipios by provincia:", error)
      }
      return (municipiosFallback as Municipio[]).filter(
        (m) => m.provincia_codigo === provinciaCodigo,
      )
    }

    return data.map((m) => ({
      codigo: m.codigo_municipio,
      provincia_codigo: m.codigo_provincia,
      nombre: m.nombre_municipio,
      activa: true,
    }))
  }

  static async getMunicipioByCode(codigo: string): Promise<Municipio | null> {
    const { data, error } = await supabase
      .from("dgii_catalogo_provincias_municipios")
      .select("codigo_municipio, codigo_provincia, nombre_municipio")
      .eq("codigo_municipio", codigo)
      .maybeSingle()

    if (error || !data) {
      if (error) {
        console.error("Error fetching municipio:", error)
      }
      return (
        (municipiosFallback as Municipio[]).find((m) => m.codigo === codigo) ||
        null
      )
    }

    return {
      codigo: data.codigo_municipio,
      provincia_codigo: data.codigo_provincia,
      nombre: data.nombre_municipio,
      activa: true,
    }
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
