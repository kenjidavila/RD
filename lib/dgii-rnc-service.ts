export interface ContribuyenteInfo {
  rnc: string
  nombre: string
  nombre_comercial?: string
  categoria?: string
  regimen_pagos?: string
  estado: "ACTIVO" | "INACTIVO" | "SUSPENDIDO"
  actividad_economica?: string
  direccion?: string
  telefono?: string
  email?: string
}

export class DGIIRNCService {
  private static readonly DGII_RNC_URL = "https://dgii.gov.do/app/WebApps/Consultas/rnc/WRNC.aspx"
  private static readonly SOAP_ACTION = "http://dgii.gov.do/GetContribuyentes"

  static async consultarRNC(rnc: string): Promise<ContribuyenteInfo | null> {
    try {
      // Validar formato de RNC
      if (!this.validateRNCFormat(rnc)) {
        throw new Error("Formato de RNC inválido")
      }

      // Crear solicitud SOAP
      const soapRequest = this.createSOAPRequest(rnc)

      // Realizar consulta HTTP
      const response = await fetch("/api/dgii/consultar-rnc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rnc,
          soapRequest,
        }),
      })

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Error desconocido")
      }

      return result.data
    } catch (error) {
      console.error("Error consultando RNC:", error)
      throw error
    }
  }

  static validateRNCFormat(rnc: string): boolean {
    // RNC: 9 dígitos
    // Cédula: 11 dígitos con formato XXX-XXXXXXX-X
    const rncPattern = /^\d{9}$/
    const cedulaPattern = /^\d{3}-?\d{7}-?\d{1}$|^\d{11}$/

    return rncPattern.test(rnc) || cedulaPattern.test(rnc.replace(/-/g, ""))
  }

  static createSOAPRequest(rnc: string): string {
    return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
               xmlns:xsd="http://www.w3.org/2001/XMLSchema" 
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <GetContribuyentes xmlns="http://dgii.gov.do/">
      <value>${rnc}</value>
      <patronBusqueda>1</patronBusqueda>
      <inicioFilas>1</inicioFilas>
      <filasPagina>1</filasPagina>
      <columnaOrden>1</columnaOrden>
    </GetContribuyentes>
  </soap:Body>
</soap:Envelope>`
  }

  static parseSOAPResponse(soapResponse: string): ContribuyenteInfo | null {
    try {
      // Parsear respuesta XML
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(soapResponse, "text/xml")

      // Buscar datos del contribuyente en la respuesta
      const contribuyenteNode = xmlDoc.querySelector("Contribuyente") || xmlDoc.querySelector("GetContribuyentesResult")

      if (!contribuyenteNode) {
        return null
      }

      // Extraer información
      const rnc = this.getNodeValue(contribuyenteNode, "RNC") || this.getNodeValue(contribuyenteNode, "Rnc")

      const nombre =
        this.getNodeValue(contribuyenteNode, "NOMBRE") ||
        this.getNodeValue(contribuyenteNode, "Nombre") ||
        this.getNodeValue(contribuyenteNode, "RazonSocial")

      if (!rnc || !nombre) {
        return null
      }

      const contribuyente: ContribuyenteInfo = {
        rnc: rnc.trim(),
        nombre: nombre.trim(),
        nombre_comercial:
          this.getNodeValue(contribuyenteNode, "NOMBRE_COMERCIAL") ||
          this.getNodeValue(contribuyenteNode, "NombreComercial"),
        categoria:
          this.getNodeValue(contribuyenteNode, "CATEGORIA") || this.getNodeValue(contribuyenteNode, "Categoria"),
        regimen_pagos:
          this.getNodeValue(contribuyenteNode, "REGIMEN_PAGOS") || this.getNodeValue(contribuyenteNode, "RegimenPagos"),
        estado: this.parseEstado(
          this.getNodeValue(contribuyenteNode, "ESTADO") || this.getNodeValue(contribuyenteNode, "Estado"),
        ),
        actividad_economica:
          this.getNodeValue(contribuyenteNode, "ACTIVIDAD_ECONOMICA") ||
          this.getNodeValue(contribuyenteNode, "ActividadEconomica"),
        direccion:
          this.getNodeValue(contribuyenteNode, "DIRECCION") || this.getNodeValue(contribuyenteNode, "Direccion"),
        telefono: this.getNodeValue(contribuyenteNode, "TELEFONO") || this.getNodeValue(contribuyenteNode, "Telefono"),
        email: this.getNodeValue(contribuyenteNode, "EMAIL") || this.getNodeValue(contribuyenteNode, "Email"),
      }

      return contribuyente
    } catch (error) {
      console.error("Error parseando respuesta SOAP:", error)
      return null
    }
  }

  private static getNodeValue(parentNode: Element, tagName: string): string | undefined {
    const node = parentNode.querySelector(tagName) || parentNode.getElementsByTagName(tagName)[0]
    return node?.textContent?.trim() || undefined
  }

  private static parseEstado(estado?: string): "ACTIVO" | "INACTIVO" | "SUSPENDIDO" {
    if (!estado) return "INACTIVO"

    const estadoUpper = estado.toUpperCase()
    if (estadoUpper.includes("ACTIVO")) return "ACTIVO"
    if (estadoUpper.includes("SUSPENDIDO")) return "SUSPENDIDO"
    return "INACTIVO"
  }

  // Método para validar RNC con dígito verificador
  static validateRNCCheckDigit(rnc: string): boolean {
    if (rnc.length !== 9) return false

    const digits = rnc.split("").map(Number)
    const weights = [7, 9, 8, 6, 5, 4, 3, 2]

    let sum = 0
    for (let i = 0; i < 8; i++) {
      sum += digits[i] * weights[i]
    }

    const remainder = sum % 11
    let checkDigit = 0

    if (remainder > 1) {
      checkDigit = 11 - remainder
    }

    return digits[8] === checkDigit
  }

  // Método para validar cédula con dígito verificador
  static validateCedulaCheckDigit(cedula: string): boolean {
    const cleanCedula = cedula.replace(/-/g, "")
    if (cleanCedula.length !== 11) return false

    const digits = cleanCedula.split("").map(Number)
    const weights = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2]

    let sum = 0
    for (let i = 0; i < 10; i++) {
      let product = digits[i] * weights[i]
      if (product > 9) {
        product = Math.floor(product / 10) + (product % 10)
      }
      sum += product
    }

    const checkDigit = (10 - (sum % 10)) % 10
    return digits[10] === checkDigit
  }

  // Cache para evitar consultas repetidas
  private static cache = new Map<string, { data: ContribuyenteInfo | null; timestamp: number }>()
  private static readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

  static async consultarRNCConCache(rnc: string): Promise<ContribuyenteInfo | null> {
    const cached = this.cache.get(rnc)
    const now = Date.now()

    if (cached && now - cached.timestamp < this.CACHE_DURATION) {
      return cached.data
    }

    try {
      const data = await this.consultarRNC(rnc)
      this.cache.set(rnc, { data, timestamp: now })
      return data
    } catch (error) {
      // Si hay error y tenemos cache, devolver cache aunque esté expirado
      if (cached) {
        return cached.data
      }
      throw error
    }
  }

  // Limpiar cache
  static clearCache(): void {
    this.cache.clear()
  }

  // Obtener estadísticas de cache
  static getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    }
  }
}
