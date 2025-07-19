/**
 * Documentación completa de endpoints DGII para facturación electrónica
 * República Dominicana - Dirección General de Impuestos Internos
 */

export interface DGIIEndpointInfo {
  name: string
  url: string
  method: "GET" | "POST"
  description: string
  authentication: boolean
  parameters?: Record<string, string>
  requestFormat?: string
  responseFormat?: string
  example?: string
}

export interface DGIIEnvironment {
  name: string
  description: string
  baseUrl: string
  endpoints: DGIIEndpointInfo[]
}

export const DGII_ENVIRONMENTS: Record<string, DGIIEnvironment> = {
  certificacion: {
    name: "Certificación (CerteCF)",
    description: "Ambiente de pruebas para certificación de sistemas",
    baseUrl: "https://ecf.dgii.gov.do/CerteCF",
    endpoints: [
      {
        name: "Obtener Semilla",
        url: "https://ecf.dgii.gov.do/CerteCF/RecepcionSemilla",
        method: "GET",
        description: "Obtiene la semilla para el proceso de autenticación",
        authentication: false,
        responseFormat: "XML",
        example: `<?xml version="1.0" encoding="utf-8"?>
<semilla>
  <valor>ABC123XYZ789</valor>
  <fecha>2024-01-15T10:30:00Z</fecha>
</semilla>`,
      },
      {
        name: "Autenticación",
        url: "https://ecf.dgii.gov.do/CerteCF/Autenticacion",
        method: "POST",
        description: "Valida la semilla firmada y genera token de autenticación",
        authentication: false,
        requestFormat: "FormData (xml: File)",
        responseFormat: "JSON",
        example: `{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expira": "2024-01-15T11:30:00Z",
  "expedido": "2024-01-15T10:30:00Z"
}`,
      },
      {
        name: "Recepción e-CF",
        url: "https://ecf.dgii.gov.do/CerteCF/Recepcion",
        method: "POST",
        description: "Envía comprobantes fiscales electrónicos para procesamiento",
        authentication: true,
        requestFormat: "FormData (xml: File)",
        responseFormat: "JSON",
        example: `{
  "trackId": "TRK-2024-001234",
  "mensaje": "Comprobante recibido exitosamente"
}`,
      },
      {
        name: "Recepción Aprobaciones",
        url: "https://ecf.dgii.gov.do/CerteCF/Recepcion",
        method: "POST",
        description: "Envía aprobaciones o rechazos comerciales",
        authentication: true,
        requestFormat: "FormData (xml: File)",
        responseFormat: "JSON",
        example: `{
  "mensaje": ["Aprobación procesada"],
  "estado": "PROCESADO",
  "codigo": "200"
}`,
      },
      {
        name: "Recepción RI",
        url: "https://ecf.dgii.gov.do/CerteCF/RecepcionRI",
        method: "POST",
        description: "Envía representación impresa en formato PDF",
        authentication: true,
        requestFormat: "FormData (xml: File)",
        responseFormat: "JSON",
        example: `{
  "mensaje": "RI recibida exitosamente",
  "estado": "PROCESADO",
  "codigo": "200"
}`,
      },
      {
        name: "Consulta Resultado",
        url: "https://ecf.dgii.gov.do/CerteCF/ConsultaResultado",
        method: "GET",
        description: "Consulta el estado de procesamiento por TrackID",
        authentication: true,
        parameters: {
          trackid: "ID de seguimiento del comprobante",
        },
        responseFormat: "JSON",
        example: `{
  "trackId": "TRK-2024-001234",
  "codigo": 2,
  "estado": "PROCESADO",
  "rnc": "123456789",
  "eNCF": "E31000000001",
  "secuenciaUtilizada": true,
  "fechaRecepcion": "2024-01-15T10:30:00Z",
  "mensajes": [
    {
      "valor": "Comprobante procesado exitosamente",
      "codigo": 200
    }
  ]
}`,
      },
    ],
  },
  produccion: {
    name: "Producción (eCF)",
    description: "Ambiente de producción para operaciones reales",
    baseUrl: "https://ecf.dgii.gov.do/eCF",
    endpoints: [
      {
        name: "Obtener Semilla",
        url: "https://ecf.dgii.gov.do/eCF/RecepcionSemilla",
        method: "GET",
        description: "Obtiene la semilla para el proceso de autenticación",
        authentication: false,
        responseFormat: "XML",
      },
      {
        name: "Autenticación",
        url: "https://ecf.dgii.gov.do/eCF/Autenticacion",
        method: "POST",
        description: "Valida la semilla firmada y genera token de autenticación",
        authentication: false,
        requestFormat: "FormData (xml: File)",
        responseFormat: "JSON",
      },
      {
        name: "Recepción e-CF",
        url: "https://ecf.dgii.gov.do/eCF/Recepcion",
        method: "POST",
        description: "Envía comprobantes fiscales electrónicos para procesamiento",
        authentication: true,
        requestFormat: "FormData (xml: File)",
        responseFormat: "JSON",
      },
      {
        name: "Recepción Aprobaciones",
        url: "https://ecf.dgii.gov.do/eCF/Recepcion",
        method: "POST",
        description: "Envía aprobaciones o rechazos comerciales",
        authentication: true,
        requestFormat: "FormData (xml: File)",
        responseFormat: "JSON",
      },
      {
        name: "Recepción RI",
        url: "https://ecf.dgii.gov.do/eCF/RecepcionRI",
        method: "POST",
        description: "Envía representación impresa en formato PDF",
        authentication: true,
        requestFormat: "FormData (xml: File)",
        responseFormat: "JSON",
      },
      {
        name: "Consulta Resultado",
        url: "https://ecf.dgii.gov.do/eCF/ConsultaResultado",
        method: "GET",
        description: "Consulta el estado de procesamiento por TrackID",
        authentication: true,
        parameters: {
          trackid: "ID de seguimiento del comprobante",
        },
        responseFormat: "JSON",
      },
    ],
  },
}

export const CUSTOM_ENDPOINTS = {
  recepcionECF: {
    name: "Recepción e-CF (Receptor)",
    url: "/api/recepcion-ecf",
    method: "POST" as const,
    description: "Endpoint personalizado para recibir e-CF como receptor electrónico",
    authentication: false,
    requestFormat: "FormData (xml: File, emisorRNC: string)",
    responseFormat: "JSON",
    example: `{
  "success": true,
  "message": "e-CF recibido correctamente",
  "trackId": "uuid-123",
  "acuseRecibo": "XML_ACUSE_BASE64",
  "eNCF": "E31000000001"
}`,
  },
  aprobacionComercial: {
    name: "Aprobación Comercial (Receptor)",
    url: "/api/aprobacion-comercial",
    method: "POST" as const,
    description: "Endpoint para procesar aprobaciones/rechazos comerciales",
    authentication: false,
    requestFormat: "JSON",
    responseFormat: "JSON",
    example: `{
  "success": true,
  "message": "Aprobación comercial procesada correctamente",
  "trackId": "uuid-456",
  "confirmacion": "XML_CONFIRMACION",
  "eNCF": "E31000000001",
  "nuevoEstado": "aprobado_comercialmente"
}`,
  },
}

export const ESTADO_CODES = {
  "0": "Recibido",
  "1": "Procesando",
  "2": "Procesado exitosamente",
  "3": "Rechazado por validación",
  "4": "Error en procesamiento",
  "5": "Aprobado comercialmente",
  "6": "Rechazado comercialmente",
  "7": "Anulado",
  "8": "Contingencia",
}

export const MOTIVOS_RECHAZO = {
  "01": "Datos incorrectos",
  "02": "Producto no recibido",
  "03": "Precio incorrecto",
  "04": "Cantidad incorrecta",
  "05": "Servicio no prestado",
  "06": "Factura duplicada",
  "07": "Otros motivos",
}

export const FLUJO_COMPLETO = `
FLUJO COMPLETO DE AUTENTICACIÓN Y EMISIÓN:

1. AUTENTICACIÓN:
   a) GET /RecepcionSemilla → Obtener semilla
   b) Firmar semilla con certificado digital
   c) POST /Autenticacion → Obtener token de sesión

2. EMISIÓN e-CF:
   a) Generar XML del e-CF
   b) POST /Recepcion → Enviar e-CF (obtener TrackID)
   c) GET /ConsultaResultado → Consultar estado
   d) POST /RecepcionRI → Enviar PDF (opcional)

3. COMO RECEPTOR:
   a) Recibir e-CF en /api/recepcion-ecf
   b) Procesar aprobación en /api/aprobacion-comercial

4. CONFIGURACIÓN PRODUCCIÓN:
   - Cambiar URLs de CerteCF a eCF
   - Usar certificados de producción
   - Configurar timeouts apropiados
`

export function getEndpointDocumentation(
  environment: "certificacion" | "produccion",
  endpointName: string,
): DGIIEndpointInfo | undefined {
  const env = DGII_ENVIRONMENTS[environment]
  return env?.endpoints.find((endpoint) => endpoint.name === endpointName)
}

export function getAllEndpoints(environment: "certificacion" | "produccion"): DGIIEndpointInfo[] {
  return DGII_ENVIRONMENTS[environment]?.endpoints || []
}

export function getEnvironmentInfo(environment: "certificacion" | "produccion"): DGIIEnvironment | undefined {
  return DGII_ENVIRONMENTS[environment]
}

export function getEstadoDescription(codigo: string): string {
  return ESTADO_CODES[codigo as keyof typeof ESTADO_CODES] || `Estado desconocido (${codigo})`
}

export function getMotivoRechazoDescription(codigo: string): string {
  return MOTIVOS_RECHAZO[codigo as keyof typeof MOTIVOS_RECHAZO] || `Motivo desconocido (${codigo})`
}
