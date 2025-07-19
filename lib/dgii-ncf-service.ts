export interface NCFInfo {
  rnc: string
  nombre: string
  comprobante: string
  ncf: string
  vigencia: string
  estado: string
  vigente: boolean
}

export interface DGIINCFResponse {
  success: boolean
  data?: NCFInfo
  error?: string
}

export class DGIINCFService {
  private static readonly ENDPOINT = "https://dgii.gov.do/paginas/default.aspx?wsdl"
  private static readonly SOAP_ACTION = "http://dgii.gov.do/GetNCF"

  static async consultarNCF(rnc: string, ncf: string): Promise<DGIINCFResponse> {
    try {
      // Validar formato RNC
      if (!this.validateRNCFormat(rnc)) {
        return {
          success: false,
          error: "Formato de RNC inválido",
        }
      }

      // Validar formato NCF
      if (!this.validateNCFFormat(ncf)) {
        return {
          success: false,
          error: "Formato de NCF inválido",
        }
      }

      // Construir solicitud SOAP
      const soapRequest = this.buildSOAPRequest(rnc, ncf)

      // Realizar consulta
      const response = await fetch("/api/dgii/consultar-ncf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rnc, ncf, soapRequest }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error("Error consultando NCF:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      }
    }
  }

  private static validateRNCFormat(rnc: string): boolean {
    // RNC debe tener 9 dígitos
    const rncPattern = /^\d{9}$/
    return rncPattern.test(rnc.replace(/\D/g, ""))
  }

  private static validateNCFFormat(ncf: string): boolean {
    // NCF puede tener diferentes formatos:
    // - NCF tradicional: B01XXXXXXXX (11 caracteres)
    // - e-NCF: E31XXXXXXXX (11 caracteres)
    // - Formato general: [A-Z]\d{10}
    const ncfPattern = /^[A-Z]\d{10}$/
    return ncfPattern.test(ncf.toUpperCase().replace(/\s/g, ""))
  }

  private static buildSOAPRequest(rnc: string, ncf: string): string {
    return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
               xmlns:xsd="http://www.w3.org/2001/XMLSchema" 
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <GetNCF xmlns="http://dgii.gov.do/">
      <RNC>${rnc}</RNC>
      <NCF>${ncf.toUpperCase()}</NCF>
      <IMEI>WEB_CLIENT</IMEI>
    </GetNCF>
  </soap:Body>
</soap:Envelope>`
  }

  static parseSOAPResponse(soapResponse: string): NCFInfo | null {
    try {
      // Parsear respuesta XML
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(soapResponse, "text/xml")

      // Extraer resultado
      const resultElement = xmlDoc.querySelector("GetNCFResult")
      if (!resultElement || !resultElement.textContent) {
        return null
      }

      // El resultado viene como JSON string dentro del XML
      const jsonResult = JSON.parse(resultElement.textContent)

      if (!jsonResult || jsonResult.length === 0) {
        return null
      }

      const ncfData = jsonResult[0]

      return {
        rnc: ncfData.RNC || "",
        nombre: ncfData.nombre || "",
        comprobante: ncfData.comprobante || "",
        ncf: ncfData.NCF || "",
        vigencia: ncfData.vigencia || "",
        estado: ncfData.estado || "",
        vigente: ncfData.estado?.toUpperCase() === "VIGENTE",
      }
    } catch (error) {
      console.error("Error parseando respuesta SOAP NCF:", error)
      return null
    }
  }

  static getComprobanteDescription(comprobante: string): string {
    const comprobantes: Record<string, string> = {
      "FACTURA DE CRÉDITO FISCAL": "Factura de Crédito Fiscal",
      "FACTURA DE CONSUMO": "Factura de Consumo",
      "NOTA DE DÉBITO": "Nota de Débito",
      "NOTA DE CRÉDITO": "Nota de Crédito",
      COMPRAS: "Comprobante de Compras",
      "GASTOS MENORES": "Comprobante de Gastos Menores",
      "REGÍMENES ESPECIALES": "Comprobante de Regímenes Especiales",
      GUBERNAMENTAL: "Comprobante Gubernamental",
    }
    return comprobantes[comprobante?.toUpperCase()] || comprobante || "Desconocido"
  }

  static isNCFVigente(vigencia: string): boolean {
    try {
      // Parsear fecha de vigencia (formato DD/MM/YYYY)
      const [day, month, year] = vigencia.split("/").map(Number)
      const fechaVigencia = new Date(year, month - 1, day)
      const fechaActual = new Date()

      return fechaVigencia >= fechaActual
    } catch (error) {
      console.error("Error validando vigencia NCF:", error)
      return false
    }
  }

  static formatVigencia(vigencia: string): string {
    try {
      const [day, month, year] = vigencia.split("/")
      return `${day}/${month}/${year}`
    } catch (error) {
      return vigencia
    }
  }
}
