// Estándar de nomenclatura de archivos según especificaciones DGII

export type TipoXML = "ECF" | "ACECF" | "ARECF" | "ANECF" | "RFCE"

export interface FileNamingConfig {
  rncEmisor: string
  rncComprador?: string
  eNCF: string
  tipoXML: TipoXML
}

export class FileNamingStandard {
  /**
   * Genera el nombre de archivo según el estándar DGII
   * Formato: RNCEmisor+e-NCF.xml para e-CF
   * Formato: RNCComprador+e-NCF.xml para Aprobación Comercial y Acuse de Recibo
   */
  static generateFileName(config: FileNamingConfig): string {
    const { rncEmisor, rncComprador, eNCF, tipoXML } = config

    switch (tipoXML) {
      case "ECF":
      case "ANECF":
      case "RFCE":
        // Para e-CF, Anulación y Resumen FCE: RNCEmisor+e-NCF.xml
        return `${rncEmisor}${eNCF}.xml`

      case "ACECF":
      case "ARECF":
        // Para Aprobación Comercial y Acuse de Recibo: RNCComprador+e-NCF.xml
        if (!rncComprador) {
          throw new Error("RNC Comprador es requerido para Aprobación Comercial y Acuse de Recibo")
        }
        return `${rncComprador}${eNCF}.xml`

      default:
        throw new Error(`Tipo de XML no válido: ${tipoXML}`)
    }
  }

  /**
   * Valida que el nombre del archivo cumpla con el estándar
   */
  static validateFileName(fileName: string, config: FileNamingConfig): boolean {
    const expectedFileName = this.generateFileName(config)
    return fileName === expectedFileName
  }

  /**
   * Extrae información del nombre del archivo
   */
  static parseFileName(fileName: string): {
    rnc: string
    eNCF: string
    isValid: boolean
  } {
    // Remover extensión .xml
    const nameWithoutExt = fileName.replace(/\.xml$/i, "")

    // Validar formato básico (RNC + e-NCF)
    // RNC: 9-11 dígitos, e-NCF: E + 2 dígitos + 10 dígitos = 13 caracteres
    const match = nameWithoutExt.match(/^(\d{9,11})(E\d{12})$/)

    if (!match) {
      return {
        rnc: "",
        eNCF: "",
        isValid: false,
      }
    }

    return {
      rnc: match[1],
      eNCF: match[2],
      isValid: true,
    }
  }

  /**
   * Genera un nombre de archivo temporal para desarrollo/testing
   */
  static generateTempFileName(tipoXML: TipoXML): string {
    const timestamp = Date.now()
    const rncTemp = "999999999"
    const eNCFTemp = `E31${timestamp.toString().slice(-8).padStart(8, "0")}`

    return this.generateFileName({
      rncEmisor: rncTemp,
      rncComprador: rncTemp,
      eNCF: eNCFTemp,
      tipoXML,
    })
  }

  /**
   * Valida el formato del e-NCF
   */
  static validateENCF(eNCF: string): boolean {
    // Formato: E + 2 dígitos (tipo) + 10 dígitos (secuencia)
    const pattern = /^E\d{12}$/
    return pattern.test(eNCF)
  }

  /**
   * Valida el formato del RNC
   */
  static validateRNC(rnc: string): boolean {
    // RNC puede tener 9, 10 u 11 dígitos
    const pattern = /^\d{9,11}$/
    return pattern.test(rnc)
  }

  /**
   * Obtiene el tipo de comprobante del e-NCF
   */
  static getTipoComprobanteFromENCF(eNCF: string): string | null {
    if (!this.validateENCF(eNCF)) {
      return null
    }

    // Extraer los 2 dígitos del tipo (posiciones 1-2 después de la E)
    return eNCF.substring(1, 3)
  }

  /**
   * Obtiene la secuencia del e-NCF
   */
  static getSecuenciaFromENCF(eNCF: string): string | null {
    if (!this.validateENCF(eNCF)) {
      return null
    }

    // Extraer los 10 dígitos de la secuencia (posiciones 3-12 después de la E)
    return eNCF.substring(3)
  }
}
