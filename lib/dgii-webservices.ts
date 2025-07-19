export interface DGIIWebServiceConfig {
  baseUrl: string
  environment: "CerteCF" | "TesteCF" | "ECF"
  timeout: number
  apiKey?: string
}

export interface SemillaResponse {
  valor: string
  fecha: string
}

export interface AuthenticationRequest {
  xml: File
}

export interface AuthenticationResponse {
  token: string
  expira: string
  expedido: string
}

export interface ECFSubmissionRequest {
  xml: File
}

export interface ECFSubmissionResponse {
  trackId: string
  error?: string
  mensaje?: string
}

export interface RFCESubmissionResponse {
  codigo: number
  estado: string
  mensajes: Array<{
    codigo: string
    valor: string
  }>
  encf: string
  secuenciaUtilizada: boolean
}

export interface ECFStatusResponse {
  trackId: string
  codigo: number
  estado: string
  rnc: string
  eNCF: string
  secuenciaUtilizada: boolean
  fechaRecepcion: string
  mensajes: Array<{
    valor: string
    codigo: number
  }>
}

export interface ConsultaEstadoResponse {
  codigo: number
  estado: string
  rncEmisor: string
  ncfElectronico: string
  montoTotal: number
  totalITBIS: number
  fechaEmision: string
  fechaFirma: string
  rncComprador?: string
  codigoSeguridad: string
  idExtranjero?: string
}

export interface DirectorioEntry {
  nombre: string
  rnc: string
  urlRecepcion: string
  urlAceptacion: string
  urlOpcional?: string
}

export interface ServicioEstatus {
  servicio: string
  estatus: "Disponible" | "No Disponible"
  ambiente: "Produccion" | "PreCertificacion" | "Certificacion"
}

export class DGIIWebServiceClient {
  private config: DGIIWebServiceConfig
  private currentToken?: string
  private tokenExpiry?: Date

  constructor(config: DGIIWebServiceConfig) {
    this.config = config
  }

  async obtenerSemilla(): Promise<SemillaResponse> {
    const url = `${this.config.baseUrl}/${this.config.environment}/RecepcionSemilla`

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          accept: "*/*",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const xmlText = await response.text()
      return this.parseXMLSemilla(xmlText)
    } catch (error) {
      console.error("Error obteniendo semilla:", error)
      throw error
    }
  }

  async validarSemilla(xmlFile: File): Promise<AuthenticationResponse> {
    const url = `${this.config.baseUrl}/${this.config.environment}/Autenticacion`

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
      this.tokenExpiry = new Date(result.expira)

      return result
    } catch (error) {
      console.error("Error validando semilla:", error)
      throw error
    }
  }

  async enviarECF(xmlFile: File): Promise<ECFSubmissionResponse> {
    if (!this.currentToken || this.isTokenExpired()) {
      throw new Error("Token de autenticación requerido o expirado")
    }

    const url = `${this.config.baseUrl}/${this.config.environment}/Recepcion`

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

      return await response.json()
    } catch (error) {
      console.error("Error enviando e-CF:", error)
      throw error
    }
  }

  async enviarRFCE(xmlFile: File): Promise<RFCESubmissionResponse> {
    if (!this.currentToken || this.isTokenExpired()) {
      throw new Error("Token de autenticación requerido o expirado")
    }

    const url = `https://fc.dgii.gov.do/${this.config.environment}/recepcionfc/api/recepcion/ecf`

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

      return await response.json()
    } catch (error) {
      console.error("Error enviando RFCE:", error)
      throw error
    }
  }

  async consultarResultado(trackId: string): Promise<ECFStatusResponse> {
    if (!this.currentToken || this.isTokenExpired()) {
      throw new Error("Token de autenticación requerido o expirado")
    }

    const url = `${this.config.baseUrl}/${this.config.environment}/ConsultaResultado?trackid=${trackId}`

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
      console.error("Error consultando resultado:", error)
      throw error
    }
  }

  async consultarEstado(
    rncEmisor: string,
    ncfElectronico: string,
    rncComprador?: string,
    codigoSeguridad?: string,
  ): Promise<ConsultaEstadoResponse> {
    if (!this.currentToken || this.isTokenExpired()) {
      throw new Error("Token de autenticación requerido o expirado")
    }

    const params = new URLSearchParams({
      rncemisor: rncEmisor,
      ncfelectronico: ncfElectronico,
    })

    if (rncComprador) params.append("rnccomprador", rncComprador)
    if (codigoSeguridad) params.append("codigoseguridad", codigoSeguridad)

    const url = `${this.config.baseUrl}/${this.config.environment}/consultaestado/api/consultas/estado?${params}`

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
      console.error("Error consultando estado:", error)
      throw error
    }
  }

  async consultarTrackIds(
    rncEmisor: string,
    encf: string,
  ): Promise<
    Array<{
      trackId: string
      estado: string
      fechaRecepcion: string
    }>
  > {
    if (!this.currentToken || this.isTokenExpired()) {
      throw new Error("Token de autenticación requerido o expirado")
    }

    const url = `${this.config.baseUrl}/${this.config.environment}/consultatrackids/api/trackids/consulta?rncemisor=${rncEmisor}&encf=${encf}`

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
      console.error("Error consultando TrackIds:", error)
      throw error
    }
  }

  async enviarAprobacionComercial(xmlFile: File): Promise<{
    mensaje: string[]
    estado: string
    codigo: string
  }> {
    const url = `${this.config.baseUrl}/${this.config.environment}/Recepcion`

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

      return await response.json()
    } catch (error) {
      console.error("Error enviando aprobación comercial:", error)
      throw error
    }
  }

  async anularRango(xmlFile: File): Promise<{
    rnc: string
    codigo: string
    nombre: string
    mensajes: string[]
  }> {
    if (!this.currentToken || this.isTokenExpired()) {
      throw new Error("Token de autenticación requerido o expirado")
    }

    const url = `${this.config.baseUrl}/${this.config.environment}/anulacionrangos/api/operaciones/anularrango`

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

      return await response.json()
    } catch (error) {
      console.error("Error anulando rango:", error)
      throw error
    }
  }

  async consultarDirectorio(): Promise<DirectorioEntry[]> {
    if (!this.currentToken || this.isTokenExpired()) {
      throw new Error("Token de autenticación requerido o expirado")
    }

    const url = `${this.config.baseUrl}/${this.config.environment}/consultadirectorio/api/consultas/listado`

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
      console.error("Error consultando directorio:", error)
      throw error
    }
  }

  async consultarDirectorioPorRNC(rnc: string): Promise<DirectorioEntry[]> {
    if (!this.currentToken || this.isTokenExpired()) {
      throw new Error("Token de autenticación requerido o expirado")
    }

    const url = `${this.config.baseUrl}/${this.config.environment}/consultadirectorio/api/consultas/obtenerdirectorioporrnc?RNC=${rnc}`

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
      console.error("Error consultando directorio por RNC:", error)
      throw error
    }
  }

  async consultarRFCE(
    rncEmisor: string,
    encf: string,
    codigoSeguridad: string,
  ): Promise<{
    rnc: string
    encf: string
    secuenciaUtilizada: boolean
    codigo: string
    estado: string
    mensajes: Array<{
      valor: string
      codigo: number
    }>
  }> {
    if (!this.currentToken || this.isTokenExpired()) {
      throw new Error("Token de autenticación requerido o expirado")
    }

    const url = `https://fc.dgii.gov.do/ecf/consultarfce/api/Consultas/Consulta?RNC_Emisor=${rncEmisor}&ENCF=${encf}&Cod_Seguridad_eCF=${codigoSeguridad}`

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
      console.error("Error consultando RFCE:", error)
      throw error
    }
  }

  async obtenerEstatusServicios(): Promise<ServicioEstatus[]> {
    if (!this.config.apiKey) {
      throw new Error("API Key requerida para consultar estatus de servicios")
    }

    const url = "https://statusecf.dgii.gov.do/api/estatusservicios/obtenerestatus"

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          accept: "*/*",
          Authorization: `Apikey ${this.config.apiKey}`,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error obteniendo estatus de servicios:", error)
      throw error
    }
  }

  async verificarEstadoServicios(ambiente: 1 | 2 | 3): Promise<{ estado: string }> {
    if (!this.config.apiKey) {
      throw new Error("API Key requerida para verificar estado de servicios")
    }

    const url = `https://statusecf.dgii.gov.do/api/estatusservicios/verificarestado?ambiente=${ambiente}`

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          accept: "*/*",
          Authorization: `Apikey ${this.config.apiKey}`,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error verificando estado de servicios:", error)
      throw error
    }
  }

  async enviarRepresentacionImpresa(xmlFile: File): Promise<{
    mensaje: string
    estado: string
    codigo: string
  }> {
    if (!this.currentToken || this.isTokenExpired()) {
      throw new Error("Token de autenticación requerido o expirado")
    }

    const url = `${this.config.baseUrl}/${this.config.environment}/RecepcionRI`

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

      return await response.json()
    } catch (error) {
      console.error("Error enviando representación impresa:", error)
      throw error
    }
  }

  private parseXMLSemilla(xmlText: string): SemillaResponse {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xmlText, "text/xml")

    const valor = doc.querySelector("valor")?.textContent || ""
    const fecha = doc.querySelector("fecha")?.textContent || ""

    return { valor, fecha }
  }

  private isTokenExpired(): boolean {
    if (!this.tokenExpiry) return true
    return new Date() >= this.tokenExpiry
  }

  get token(): string | undefined {
    return this.currentToken
  }

  get isAuthenticated(): boolean {
    return !!this.currentToken && !this.isTokenExpired()
  }
}
