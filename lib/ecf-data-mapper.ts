export interface ECFData {
  eNCF: string
  tipoECF: string
  fechaEmision: string
  fechaFirma?: string
  trackId?: string
  codigoSeguridad?: string
  qrCodeUrl?: string

  // Emisor
  rncEmisor: string
  razonSocialEmisor: string
  direccionEmisor?: string
  telefonoEmisor?: string
  emailEmisor?: string

  // Comprador
  rncComprador?: string
  numeroIdentificacionComprador?: string
  razonSocialComprador?: string
  telefonoComprador?: string
  emailComprador?: string
  direccionComprador?: string
  provinciaComprador?: string
  municipioComprador?: string
  paisComprador?: string

  // Totales
  montoGravado18: number
  montoGravado16: number
  montoGravado0: number
  totalITBIS18: number
  totalITBIS16: number
  totalITBIS0: number
  subtotalGravado: number
  subtotalItbis: number
  subtotalExento: number
  totalItbisRetenido: number
  totalIsrRetenido: number
  montoTotal: number

  // Detalles
  detalles: ECFDetalle[]

  // Campos adicionales para exportaciones
  tipoMoneda?: string
  tipoCambio?: number
}

export interface ECFDetalle {
  numeroLinea: number
  descripcion: string
  tipoItem: "bien" | "servicio"
  cantidad: number
  precioUnitario: number
  tasaItbis: string
  descuento: number
  itbisRetenido: number
  isrRetenido: number
  montoItem: number
}

export interface EmpresaData {
  id: string
  rnc: string
  razonSocial: string
  nombreComercial?: string
  direccion?: string
  telefono?: string
  email: string
  provincia?: string
  municipio?: string
  logoUrl?: string
}

export class ECFDataMapper {
  static validateECFData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Validaciones básicas
    if (!data.eNCF) errors.push("e-NCF es requerido")
    if (!data.tipoECF) errors.push("Tipo de e-CF es requerido")
    if (!data.fechaEmision) errors.push("Fecha de emisión es requerida")
    if (!data.rncEmisor) errors.push("RNC del emisor es requerido")
    if (!data.razonSocialEmisor) errors.push("Razón social del emisor es requerida")
    if (typeof data.montoTotal !== "number" || data.montoTotal <= 0) {
      errors.push("Monto total debe ser un número mayor a 0")
    }

    // Validar detalles
    if (!data.detalles || !Array.isArray(data.detalles) || data.detalles.length === 0) {
      errors.push("Debe incluir al menos un detalle")
    } else {
      data.detalles.forEach((detalle: any, index: number) => {
        if (!detalle.descripcion) errors.push(`Detalle ${index + 1}: descripción es requerida`)
        if (typeof detalle.cantidad !== "number" || detalle.cantidad <= 0) {
          errors.push(`Detalle ${index + 1}: cantidad debe ser un número mayor a 0`)
        }
        if (typeof detalle.precioUnitario !== "number" || detalle.precioUnitario <= 0) {
          errors.push(`Detalle ${index + 1}: precio unitario debe ser un número mayor a 0`)
        }
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  static sanitizeECFData(data: any): ECFData {
    return {
      eNCF: String(data.eNCF || "").trim(),
      tipoECF: String(data.tipoECF || "").trim(),
      fechaEmision: data.fechaEmision,
      fechaFirma: data.fechaFirma,
      trackId: data.trackId,
      codigoSeguridad: data.codigoSeguridad,
      qrCodeUrl: data.qrCodeUrl,

      rncEmisor: String(data.rncEmisor || "").trim(),
      razonSocialEmisor: String(data.razonSocialEmisor || "").trim(),
      direccionEmisor: data.direccionEmisor ? String(data.direccionEmisor).trim() : undefined,
      telefonoEmisor: data.telefonoEmisor ? String(data.telefonoEmisor).trim() : undefined,
      emailEmisor: data.emailEmisor ? String(data.emailEmisor).trim() : undefined,

      rncComprador: data.rncComprador ? String(data.rncComprador).trim() : undefined,
      numeroIdentificacionComprador: data.numeroIdentificacionComprador
        ? String(data.numeroIdentificacionComprador).trim()
        : undefined,
      razonSocialComprador: data.razonSocialComprador ? String(data.razonSocialComprador).trim() : undefined,
      telefonoComprador: data.telefonoComprador ? String(data.telefonoComprador).trim() : undefined,
      emailComprador: data.emailComprador ? String(data.emailComprador).trim() : undefined,
      direccionComprador: data.direccionComprador ? String(data.direccionComprador).trim() : undefined,
      provinciaComprador: data.provinciaComprador ? String(data.provinciaComprador).trim() : undefined,
      municipioComprador: data.municipioComprador ? String(data.municipioComprador).trim() : undefined,
      paisComprador: data.paisComprador ? String(data.paisComprador).trim() : undefined,

      montoGravado18: Number(data.montoGravado18 || 0),
      montoGravado16: Number(data.montoGravado16 || 0),
      montoGravado0: Number(data.montoGravado0 || 0),
      totalITBIS18: Number(data.totalITBIS18 || 0),
      totalITBIS16: Number(data.totalITBIS16 || 0),
      totalITBIS0: Number(data.totalITBIS0 || 0),
      subtotalGravado: Number(data.subtotalGravado || 0),
      subtotalItbis: Number(data.subtotalItbis || 0),
      subtotalExento: Number(data.subtotalExento || 0),
      totalItbisRetenido: Number(data.totalItbisRetenido || 0),
      totalIsrRetenido: Number(data.totalIsrRetenido || 0),
      montoTotal: Number(data.montoTotal || 0),

      detalles: (data.detalles || []).map((detalle: any, index: number) => ({
        numeroLinea: index + 1,
        descripcion: String(detalle.descripcion || "").trim(),
        tipoItem: detalle.tipoItem === "servicio" ? "servicio" : "bien",
        cantidad: Number(detalle.cantidad || 0),
        precioUnitario: Number(detalle.precioUnitario || 0),
        tasaItbis: String(detalle.tasaItbis || "18"),
        descuento: Number(detalle.descuento || 0),
        itbisRetenido: Number(detalle.itbisRetenido || 0),
        isrRetenido: Number(detalle.isrRetenido || 0),
        montoItem: Number(detalle.montoItem || detalle.valorTotal || 0),
      })),

      tipoMoneda: data.tipoMoneda ? String(data.tipoMoneda).trim() : undefined,
      tipoCambio: data.tipoCambio ? Number(data.tipoCambio) : undefined,
    }
  }
}
