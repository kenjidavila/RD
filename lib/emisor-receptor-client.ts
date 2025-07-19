// Cliente para comunicación entre emisores y receptores según estándar DGII

export interface EmisorReceptorConfig {
  baseUrl: string
  environment: "testecf" | "production"
  timeout: number
}

export interface EmisionComprobantesRequest {
  rnc: string
  tipoEncf: string
  urlRecepcion: string
  urlAutenticacion?: string
}

export interface ConsultaAcuseRequest {
  rnc: string
  encf: string
}

export interface EnvioAprobacionRequest {
  urlAprobacionComercial: string
  urlAutenticacion?: string
  rnc: string
  encf: string
  estadoAprobacion: "Aprobado" | "Rechazado"
}

export class EmisorReceptorClient {
  private config: EmisorReceptorConfig
  private currentToken?: string

  constructor(config: EmisorReceptorConfig) {
    this.config = config
  }

  // Autenticación con otro contribuyente
  async obtenerSemillaContribuyente(): Promise<{ valor: string; fecha: string }> {
    const url = `${this.config.baseUrl}/${this.config.environment}/emisorreceptor/fe/autenticacion/api/semilla`

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          accept: "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const xmlText = await response.text()
      return this.parseXMLSemilla(xmlText)
    } catch (error) {
      console.error("Error obteniendo semilla de contribuyente:", error)
      throw error
    }
  }

  async validarCertificadoContribuyente(xmlFile: File): Promise<{
    token: string
    expira: string
    expedido: string
  }> {
    const url = `${this.config.baseUrl}/${this.config.environment}/emisorreceptor/fe/autenticacion/api/validacioncertificado`

    const formData = new FormData()
    formData.append("xml", xmlFile)

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          accept: "application/json",
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      this.currentToken = result.token

      return result
    } catch (error) {
      console.error("Error validando certificado de contribuyente:", error)
      throw error
    }
  }

  // Emisión de comprobantes
  async emitirComprobante(request: EmisionComprobantesRequest): Promise<string> {
    if (!this.currentToken) {
      throw new Error("Token de autenticación requerido")
    }

    const url = `${this.config.baseUrl}/${this.config.environment}/emisorreceptor/api/emision/emisioncomprobantes`

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${this.currentToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.text() // Retorna XML del e-CF
    } catch (error) {
      console.error("Error emitiendo comprobante:", error)
      throw error
    }
  }

  // Consulta de acuse de recibo
  async consultarAcuseRecibo(request: ConsultaAcuseRequest): Promise<{
    rnc: string
    encf: string
    estado: string
    mensajes: string[]
  }> {
    if (!this.currentToken) {
      throw new Error("Token de autenticación requerido")
    }

    const url = `${this.config.baseUrl}/${this.config.environment}/emisorreceptor/api/emision/consultaacuserecibo?Rnc=${request.rnc}&Encf=${request.encf}`

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${this.currentToken}`,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error consultando acuse de recibo:", error)
      throw error
    }
  }

  // Envío de aprobación comercial
  async enviarAprobacionComercial(request: EnvioAprobacionRequest): Promise<string> {
    if (!this.currentToken) {
      throw new Error("Token de autenticación requerido")
    }

    const url = `${this.config.baseUrl}/${this.config.environment}/emisorreceptor/api/emision/envioaprobacioncomercial`

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${this.currentToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.text() // Retorna XML de aprobación comercial
    } catch (error) {
      console.error("Error enviando aprobación comercial:", error)
      throw error
    }
  }

  // Recepción de comprobantes (para implementar en el servidor del contribuyente)
  async recibirComprobante(xmlFile: File): Promise<string> {
    // Este método simula la recepción de un e-CF
    // En una implementación real, esto sería un endpoint en el servidor del contribuyente

    const url = `${this.config.baseUrl}/${this.config.environment}/emisorreceptor/fe/recepcion/api/ecf`

    const formData = new FormData()
    formData.append("xml", xmlFile)

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${this.currentToken}`,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.text() // Retorna XML de acuse de recibo
    } catch (error) {
      console.error("Error recibiendo comprobante:", error)
      throw error
    }
  }

  // Recepción de aprobación comercial (para implementar en el servidor del contribuyente)
  async recibirAprobacionComercial(xmlFile: File): Promise<boolean> {
    // Este método simula la recepción de una aprobación comercial
    // En una implementación real, esto sería un endpoint en el servidor del contribuyente

    const url = `${this.config.baseUrl}/${this.config.environment}/emisorreceptor/fe/aprobacioncomercial/api/ecf`

    const formData = new FormData()
    formData.append("xml", xmlFile)

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${this.currentToken}`,
        },
        body: formData,
      })

      return response.ok // HTTP 200 = satisfactorio, HTTP 400 = insatisfactorio
    } catch (error) {
      console.error("Error recibiendo aprobación comercial:", error)
      return false
    }
  }

  private parseXMLSemilla(xmlText: string): { valor: string; fecha: string } {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xmlText, "text/xml")

    const valor = doc.querySelector("valor")?.textContent || ""
    const fecha = doc.querySelector("fecha")?.textContent || ""

    return { valor, fecha }
  }
}
