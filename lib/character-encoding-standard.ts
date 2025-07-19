// Estándar de codificación de caracteres según especificaciones DGII

export class CharacterEncodingStandard {
  /**
   * Caracteres XML que deben ser escapados
   */
  private static readonly XML_ESCAPE_MAP: Record<string, string> = {
    '"': "&#34;",
    "&": "&#38;",
    "'": "&#39;",
    "<": "&#60;",
    ">": "&#62;",
  }

  /**
   * Caracteres URL que deben ser codificados para códigos QR
   */
  private static readonly URL_ENCODE_MAP: Record<string, string> = {
    " ": "%20",
    "!": "%21",
    '"': "%22",
    "#": "%23",
    $: "%24",
    "&": "%26",
    "'": "%27",
    "(": "%28",
    ")": "%29",
    "*": "%2A",
    "+": "%2B",
    ",": "%2C",
    "-": "%2D",
    ".": "%2E",
    "/": "%2F",
    ":": "%3A",
    ";": "%3B",
    "<": "%3C",
    "=": "%3D",
    ">": "%3E",
    "?": "%3F",
    "@": "%40",
    "[": "%5B",
    "]": "%5D",
    "\\": "%5C",
    "^": "%5E",
    _: "%5F",
    "`": "%60",
  }

  /**
   * Escapa caracteres especiales para XML
   */
  static escapeXMLCharacters(text: string): string {
    if (!text) return text

    return text.replace(/[&<>"']/g, (match) => {
      return this.XML_ESCAPE_MAP[match] || match
    })
  }

  /**
   * Codifica caracteres para URLs (códigos QR)
   */
  static encodeForURL(text: string): string {
    if (!text) return text

    return text.replace(/[ !"#$&'()*+,\-./:;<=>?@[\\\]^_`]/g, (match) => {
      return this.URL_ENCODE_MAP[match] || match
    })
  }

  /**
   * Valida que el texto no contenga caracteres prohibidos para XML
   */
  static validateXMLContent(text: string): {
    isValid: boolean
    invalidCharacters: string[]
  } {
    const invalidChars: string[] = []
    const prohibitedPattern = /[&<>"']/g

    let match
    while ((match = prohibitedPattern.exec(text)) !== null) {
      if (!invalidChars.includes(match[0])) {
        invalidChars.push(match[0])
      }
    }

    return {
      isValid: invalidChars.length === 0,
      invalidCharacters: invalidChars,
    }
  }

  /**
   * Valida que el texto no contenga caracteres prohibidos para URLs
   */
  static validateURLContent(text: string): {
    isValid: boolean
    invalidCharacters: string[]
  } {
    const invalidChars: string[] = []
    const prohibitedPattern = /[ !"#$&'()*+,\-./:;<=>?@[\\\]^_`]/g

    let match
    while ((match = prohibitedPattern.exec(text)) !== null) {
      if (!invalidChars.includes(match[0])) {
        invalidChars.push(match[0])
      }
    }

    return {
      isValid: invalidChars.length === 0,
      invalidCharacters: invalidChars,
    }
  }

  /**
   * Limpia el texto removiendo tags vacíos
   */
  static removeEmptyTags(xmlText: string): string {
    // Remover tags que están completamente vacíos: <tag></tag> o <tag/>
    return xmlText
      .replace(/<([^>]+)><\/\1>/g, "") // <tag></tag>
      .replace(/<([^>]+)\/>/g, "") // <tag/>
      .replace(/\s*\n\s*\n/g, "\n") // Limpiar líneas vacías extra
  }

  /**
   * Valida que el XML no contenga tags vacíos
   */
  static validateNoEmptyTags(xmlText: string): {
    isValid: boolean
    emptyTags: string[]
  } {
    const emptyTags: string[] = []

    // Buscar tags vacíos del tipo <tag></tag>
    const emptyTagPattern = /<([^>]+)><\/\1>/g
    let match
    while ((match = emptyTagPattern.exec(xmlText)) !== null) {
      if (!emptyTags.includes(match[1])) {
        emptyTags.push(match[1])
      }
    }

    // Buscar tags vacíos del tipo <tag/>
    const selfClosingEmptyPattern = /<([^>]+)\/>/g
    while ((match = selfClosingEmptyPattern.exec(xmlText)) !== null) {
      const tagName = match[1].split(" ")[0] // Obtener solo el nombre del tag
      if (!emptyTags.includes(tagName)) {
        emptyTags.push(tagName)
      }
    }

    return {
      isValid: emptyTags.length === 0,
      emptyTags,
    }
  }

  /**
   * Prepara texto para inclusión en XML
   */
  static prepareForXML(text: string): string {
    if (!text) return text

    return this.escapeXMLCharacters(text.trim())
  }

  /**
   * Prepara texto para inclusión en URL de código QR
   */
  static prepareForQRCode(text: string): string {
    if (!text) return text

    return this.encodeForURL(text.trim())
  }

  /**
   * Valida y limpia XML completo
   */
  static validateAndCleanXML(xmlText: string): {
    isValid: boolean
    cleanedXML: string
    errors: string[]
  } {
    const errors: string[] = []
    let cleanedXML = xmlText

    // Validar tags vacíos
    const emptyTagsValidation = this.validateNoEmptyTags(xmlText)
    if (!emptyTagsValidation.isValid) {
      errors.push(`Tags vacíos encontrados: ${emptyTagsValidation.emptyTags.join(", ")}`)
      cleanedXML = this.removeEmptyTags(cleanedXML)
    }

    // Validar caracteres XML en el contenido
    const xmlValidation = this.validateXMLContent(xmlText)
    if (!xmlValidation.isValid) {
      errors.push(`Caracteres XML no escapados: ${xmlValidation.invalidCharacters.join(", ")}`)
    }

    return {
      isValid: errors.length === 0,
      cleanedXML,
      errors,
    }
  }
}
