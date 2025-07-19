export interface ECFDetalle {
  numeroLinea: number
  codigoItem?: string
  descripcion: string
  cantidad: number
  unidadMedida?: string
  precioUnitario: number
  montoItem: number
  tasaITBIS: "E" | "0" | "16" | "18"
  montoITBIS?: number
  itbisRetenido?: number
  isrRetenido?: number
  impuestosAdicionales?: Array<{
    tipoImpuesto: string
    tasa: number
    monto: number
  }>
}

export interface ECFData {
  // Identificación del documento
  tipoECF: string
  eNCF: string
  fechaEmision: string
  fechaVencimiento?: string
  fechaFirma?: string
  fechaModificacion?: string

  // Estado del documento
  estado?: "borrador" | "preview" | "emitido" | "anulado"
  trackId?: string
  codigoSeguridad?: string
  qrCodeUrl?: string

  // Datos del emisor
  rncEmisor: string
  razonSocialEmisor: string
  nombreComercialEmisor?: string
  direccionEmisor: string
  municipioEmisor: string
  provinciaEmisor: string
  telefonoEmisor?: string
  emailEmisor?: string

  // Datos del comprador
  tipoIdentificacionComprador?: string
  numeroIdentificacionComprador?: string
  razonSocialComprador?: string
  direccionComprador?: string
  municipioComprador?: string
  provinciaComprador?: string
  paisComprador?: string

  // Detalles de la factura
  detalles: ECFDetalle[]

  // Totales
  montoGravado18: number
  montoGravado16: number
  montoGravado0: number
  montoExento: number
  totalITBIS18: number
  totalITBIS16: number
  totalITBIS0: number
  totalITBISRetenido: number
  totalISRRetenido: number
  montoTotal: number

  // Información adicional
  condicionPago?: string
  formaPago?: string
  tipoMoneda?: string
  tipoCambio?: number
  observaciones?: string

  // Metadatos
  metadata?: Record<string, any>
}

export interface EmpresaData {
  empresa_id?: string
  rnc: string
  razonSocial: string
  nombreComercial?: string
  direccion: string
  municipio: string
  provincia: string
  telefono?: string
  email?: string
  website?: string
  logo?: string
  configuracion?: Record<string, any>
}

export interface PDFGenerationRequest {
  ecfData: ECFData
  empresaData: EmpresaData
  filename?: string
  tipo?: "preview" | "final"
  incluirQR?: boolean
}

export interface PDFStorageRecord {
  id: string
  empresa_id: string
  usuario_id: string
  track_id: string
  e_ncf: string
  tipo_documento: string
  filename: string
  storage_path: string
  file_size: number
  content_type: string
  estado: "disponible" | "descargado" | "expirado"
  tipo_pdf: "preview" | "final"
  metadata: Record<string, any>
  fecha_generacion: string
  fecha_expiracion: string
  fecha_descarga?: string
  descargas_count: number
  created_at: string
  updated_at: string
}

export interface PDFStorageConfig {
  retention_days: number
  max_file_size_mb: number
  auto_cleanup_enabled: boolean
  storage_bucket: string
  max_downloads: number
  notification_enabled: boolean
}

export interface PDFStorageStats {
  total_pdfs: number
  total_size_mb: number
  pdfs_disponibles: number
  pdfs_expirados: number
  pdfs_descargados: number
  oldest_pdf: string
  newest_pdf: string
}
