import { createClient } from "@/utils/supabase/server"

const supabase = createClient()

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
  ): Promise<{ success: boolean; data?: Uint8Array; filename?: string; error?: string }> {
    try {
      // Obtener metadatos del archivo
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
        data: uint8Array,
        filename: metadata.filename,
      }
    } catch (error) {
      console.error("Error in retrievePDF:", error)
      return { success: false, error: "Error interno del servidor" }
    }
  }
}
