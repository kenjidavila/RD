import { createClient } from "@/utils/supabase/server"


export interface PDFStorageRecord {
  id: string
  user_id: string
  empresa_id?: string
  track_id?: string
  e_ncf?: string
  tipo_documento: string
  filename: string
  file_path: string
  file_size: number
  mime_type: string
  emisor_rnc?: string
  emisor_nombre?: string
  comprador_rnc?: string
  comprador_nombre?: string
  monto_total?: number
  fecha_emision?: string
  download_count: number
  max_downloads: number
  expires_at?: string
  created_at: string
  updated_at: string
  last_accessed_at?: string
}

export class PDFStorageService {
  private static readonly BUCKET_NAME = "pdfs-temporales"
  private static get client() {
   return createClient()
  }

  static async storePDF(
    pdfBuffer: Uint8Array,
    ecfData: any,
    empresaData: any,
    userId: string,
    tipo: "preview" | "final" = "final",
  ): Promise<{ success: boolean; record?: PDFStorageRecord; error?: string }> {
    try {
      // Calcular fecha de expiración (30 días por defecto)
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30)

      // Generar nombre único para el archivo
      const timestamp = Date.now()
      const filename = `${tipo}_${ecfData.eNCF || timestamp}_${timestamp}.pdf`
      const filePath = `${userId}/${filename}`

      // Subir archivo a Supabase Storage
      const supabase = this.client
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, pdfBuffer, {
          contentType: "application/pdf",
          upsert: false,
        })

      if (uploadError) {
        console.error("Error uploading PDF:", uploadError)
        return { success: false, error: "Error al subir archivo" }
      }

      // Guardar metadatos en base de datos
      const { data: dbData, error: dbError } = await supabase
        .from("pdf_storage")
        .insert({
          user_id: userId,
          empresa_id: empresaData.id,
          track_id: ecfData.trackId,
          e_ncf: ecfData.eNCF,
          tipo_documento: tipo,
          filename,
          file_path: filePath,
          file_size: pdfBuffer.length,
          mime_type: "application/pdf",
          emisor_rnc: empresaData.rnc,
          emisor_nombre: empresaData.razonSocial,
          comprador_rnc: ecfData.rncComprador,
          comprador_nombre: ecfData.razonSocialComprador,
          monto_total: ecfData.montoTotal,
          fecha_emision: ecfData.fechaEmision,
          max_downloads: 10,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single()

      if (dbError) {
        console.error("Error saving PDF metadata:", dbError)
        // Intentar limpiar archivo subido
        await supabase.storage.from(this.BUCKET_NAME).remove([filePath])
        return { success: false, error: "Error al guardar metadatos" }
      }

      return { success: true, record: dbData }
    } catch (error) {
      console.error("Error in storePDF:", error)
      return { success: false, error: "Error interno del servidor" }
    }
  }

  static async retrievePDF(
    id: string,
    userId: string,
  ): Promise<{
    success: boolean
    pdfBuffer?: Uint8Array
    record?: PDFStorageRecord
    error?: string
  }> {
    try {
      // Obtener metadatos del archivo
      const supabase = this.client
      const { data: metadata, error: metadataError } = await supabase
        .from("pdf_storage")
        .select("*")
        .eq("id", id)
        .eq("user_id", userId)
        .single()

      if (metadataError || !metadata) {
        return { success: false, error: "Archivo no encontrado" }
      }

      // Verificar si el archivo ha expirado
      if (metadata.expires_at && new Date(metadata.expires_at) < new Date()) {
        return { success: false, error: "Archivo expirado" }
      }

      // Verificar límite de descargas
      if (metadata.download_count >= metadata.max_downloads) {
        return { success: false, error: "Límite de descargas excedido" }
      }

      // Descargar archivo desde Supabase Storage
      const { data: fileData, error: fileError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .download(metadata.file_path)

      if (fileError || !fileData) {
        console.error("Error downloading PDF:", fileError)
        return { success: false, error: "Error al descargar archivo" }
      }

      // Actualizar contador de descargas y último acceso
      await supabase
        .from("pdf_storage")
        .update({
          download_count: metadata.download_count + 1,
          last_accessed_at: new Date().toISOString(),
        })
        .eq("id", id)

      // Convertir Blob a Uint8Array
      const arrayBuffer = await fileData.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)

      return {
        success: true,
        pdfBuffer: uint8Array,
        record: metadata as PDFStorageRecord,
      }
    } catch (error) {
      console.error("Error in retrievePDF:", error)
      return { success: false, error: "Error interno del servidor" }
    }
  }

  static async listUserPDFs(
    userId: string,
    filters: {
      tipo_pdf?: "preview" | "final"
      estado?: "disponible" | "descargado" | "expirado"
      desde?: string
      hasta?: string
      limit?: number
      offset?: number
    } = {},
  ): Promise<{
    success: boolean
    pdfs?: PDFStorageRecord[]
    total?: number
    error?: string
  }> {
    try {
      const supabase = this.client

      let query = supabase
        .from("pdf_storage")
        .select("*", { count: "exact" })
        .eq("user_id", userId)

      if (filters.tipo_pdf) {
        query = query.eq("tipo_documento", filters.tipo_pdf)
      }

      const nowIso = new Date().toISOString()
      if (filters.estado === "expirado") {
        query = query.lte("expires_at", nowIso)
      } else if (filters.estado === "disponible") {
        query = query.gt("expires_at", nowIso)
      }

      if (filters.desde) {
        query = query.gte("created_at", filters.desde)
      }
      if (filters.hasta) {
        query = query.lte("created_at", filters.hasta)
      }

      const limit = filters.limit ?? 20
      const offset = filters.offset ?? 0
      query = query.range(offset, offset + limit - 1).order("created_at", { ascending: false })

      const { data, count, error } = await query

      if (error) {
        console.error("Error listing PDFs:", error)
        return { success: false, error: error.message }
      }

      return { success: true, pdfs: data as PDFStorageRecord[], total: count ?? 0 }
    } catch (err) {
      console.error("Error in listUserPDFs:", err)
      return { success: false, error: "Error interno del servidor" }
    }
  }

  static async getPDFByTrackId(trackId: string, tipo: "preview" | "final") {
    try {
      const supabase = this.client
      const { data, error } = await supabase
        .from("pdf_storage")
        .select("*")
        .eq("track_id", trackId)
        .eq("tipo_documento", tipo)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (error || !data) {
        return { success: false, error: error?.message || "No encontrado" }
      }

      return { success: true, record: data as PDFStorageRecord }
    } catch (err) {
      console.error("Error in getPDFByTrackId:", err)
      return { success: false, error: "Error interno del servidor" }
    }
  }

  static async cleanupExpiredPDFs() {
    try {
      const supabase = this.client
      const { data, error } = await supabase.rpc("cleanup_expired_pdfs")
      if (error) {
        console.error("Error cleaning PDFs:", error)
        return { success: false, error: error.message }
      }
      return { success: true, cleaned: data as number }
    } catch (err) {
      console.error("Error in cleanupExpiredPDFs:", err)
      return { success: false, error: "Error interno del servidor" }
    }
  }

  static async getStorageStats(userId: string) {
    try {
      const supabase = this.client
      const { data, error } = await supabase.rpc("get_pdf_storage_stats", {
        p_user_id: userId,
      })

      if (error) {
        console.error("Error getting storage stats:", error)
        return { success: false, error: error.message }
      }

      return { success: true, stats: data }
    } catch (err) {
      console.error("Error in getStorageStats:", err)
      return { success: false, error: "Error interno del servidor" }
    }
  }
}
