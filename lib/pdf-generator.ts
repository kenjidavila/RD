import jsPDF from "jspdf"
import "jspdf-autotable"
import { logger } from "./logger"

export interface InvoiceData {
  id: string
  numero: string
  fecha: string
  cliente: {
    nombre: string
    rnc?: string
    cedula?: string
    direccion?: string
    telefono?: string
    email?: string
  }
  empresa: {
    nombre: string
    rnc: string
    direccion: string
    telefono?: string
    email?: string
  }
  items: Array<{
    codigo?: string
    descripcion: string
    cantidad: number
    unidadMedida: string
    precioUnitario: number
    descuento?: number
    tipoImpuesto: string
    tasaImpuesto: number
    montoImpuesto: number
    subtotal: number
  }>
  subtotal: number
  descuento: number
  impuestos: number
  total: number
  moneda: string
  ncf?: string
  observaciones?: string
  emisor: {
    rnc: string
    razonSocial: string
    nombreComercial?: string
    direccion: string
    telefono?: string
    email?: string
    provincia?: string
    municipio?: string
    sector?: string
  }
  receptor: {
    rncCedula: string
    nombre: string
    direccion?: string
    telefono?: string
    email?: string
  }
  comprobante: {
    tipoComprobante: string
    ncf: string
    fechaEmision: string
    fechaVencimiento?: string
    moneda: string
    tasaCambio?: number
    condicionPago?: string
    vendedor?: string
    observaciones?: string
  }
  totales: {
    subtotal: number
    descuentos: number
    impuestos: number
    total: number
    montoLetras: string
  }
  adicional?: {
    ordenCompra?: string
    codigoModificacion?: string
    rncOtroContribuyente?: string
    fechaOrdenCompra?: string
    numeroContrato?: string
    fechaInicioContrato?: string
    fechaFinContrato?: string
  }
}

export class PDFGenerator {
  private doc: jsPDF
  private pageWidth: number
  private pageHeight: number
  private margin: number

  constructor() {
    this.doc = new jsPDF("p", "mm", "a4")
    this.pageWidth = this.doc.internal.pageSize.getWidth()
    this.pageHeight = this.doc.internal.pageSize.getHeight()
    this.margin = 15
  }

  private addHeader(data: InvoiceData) {
    // Logo placeholder (si existe)
    // this.doc.addImage(logoBase64, 'PNG', this.margin, this.margin, 30, 15)

    // Información del emisor
    this.doc.setFontSize(16)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(data.emisor.razonSocial, this.margin, this.margin + 10)

    this.doc.setFontSize(10)
    this.doc.setFont("helvetica", "normal")

    let yPos = this.margin + 18
    if (data.emisor.nombreComercial) {
      this.doc.text(`Nombre Comercial: ${data.emisor.nombreComercial}`, this.margin, yPos)
      yPos += 5
    }

    this.doc.text(`RNC: ${data.emisor.rnc}`, this.margin, yPos)
    yPos += 5
    this.doc.text(`Dirección: ${data.emisor.direccion}`, this.margin, yPos)
    yPos += 5

    if (data.emisor.telefono) {
      this.doc.text(`Teléfono: ${data.emisor.telefono}`, this.margin, yPos)
      yPos += 5
    }

    if (data.emisor.email) {
      this.doc.text(`Email: ${data.emisor.email}`, this.margin, yPos)
      yPos += 5
    }

    // Información del comprobante (lado derecho)
    const rightX = this.pageWidth - this.margin - 60
    this.doc.setFontSize(14)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(this.getTipoComprobanteText(data.comprobante.tipoComprobante), rightX, this.margin + 10)

    this.doc.setFontSize(10)
    this.doc.setFont("helvetica", "normal")
    this.doc.text(`NCF: ${data.comprobante.ncf}`, rightX, this.margin + 20)
    this.doc.text(`Fecha: ${data.comprobante.fechaEmision}`, rightX, this.margin + 27)

    if (data.comprobante.fechaVencimiento) {
      this.doc.text(`Vence: ${data.comprobante.fechaVencimiento}`, rightX, this.margin + 34)
    }

    return yPos + 10
  }

  private addReceptorInfo(data: InvoiceData, startY: number) {
    this.doc.setFontSize(12)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("FACTURAR A:", this.margin, startY)

    this.doc.setFontSize(10)
    this.doc.setFont("helvetica", "normal")

    let yPos = startY + 8
    this.doc.text(`${data.receptor.rncCedula} - ${data.receptor.nombre}`, this.margin, yPos)
    yPos += 5

    if (data.receptor.direccion) {
      this.doc.text(`Dirección: ${data.receptor.direccion}`, this.margin, yPos)
      yPos += 5
    }

    if (data.receptor.telefono) {
      this.doc.text(`Teléfono: ${data.receptor.telefono}`, this.margin, yPos)
      yPos += 5
    }

    if (data.receptor.email) {
      this.doc.text(`Email: ${data.receptor.email}`, this.margin, yPos)
      yPos += 5
    }

    return yPos + 10
  }

  private addItemsTable(data: InvoiceData, startY: number) {
    const tableColumns = ["Descripción", "Cant.", "U.M.", "Precio Unit.", "Descuento", "Impuesto", "Subtotal"]

    const tableRows = data.items.map((item) => [
      item.descripcion,
      item.cantidad.toString(),
      item.unidadMedida,
      this.formatCurrency(item.precioUnitario),
      this.formatCurrency(item.descuento || 0),
      this.formatCurrency(item.montoImpuesto),
      this.formatCurrency(item.subtotal),
    ])

    // @ts-expect-error jsPDF autoTable has incomplete types
    this.doc.autoTable({
      head: [tableColumns],
      body: tableRows,
      startY: startY,
      margin: { left: this.margin, right: this.margin },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: "bold",
      },
      columnStyles: {
        1: { halign: "center" }, // Cantidad
        2: { halign: "center" }, // U.M.
        3: { halign: "right" }, // Precio
        4: { halign: "right" }, // Descuento
        5: { halign: "right" }, // Impuesto
        6: { halign: "right" }, // Subtotal
      },
    })

    // @ts-expect-error jsPDF lastAutoTable not typed
    return this.doc.lastAutoTable.finalY + 10
  }

  private addTotals(data: InvoiceData, startY: number) {
    const rightX = this.pageWidth - this.margin - 50

    this.doc.setFontSize(10)
    this.doc.setFont("helvetica", "normal")

    let yPos = startY
    this.doc.text("Subtotal:", rightX - 30, yPos)
    this.doc.text(this.formatCurrency(data.totales.subtotal), rightX, yPos, { align: "right" })
    yPos += 6

    if (data.totales.descuentos > 0) {
      this.doc.text("Descuentos:", rightX - 30, yPos)
      this.doc.text(`-${this.formatCurrency(data.totales.descuentos)}`, rightX, yPos, { align: "right" })
      yPos += 6
    }

    this.doc.text("Impuestos:", rightX - 30, yPos)
    this.doc.text(this.formatCurrency(data.totales.impuestos), rightX, yPos, { align: "right" })
    yPos += 6

    // Línea separadora
    this.doc.line(rightX - 35, yPos, rightX + 5, yPos)
    yPos += 8

    this.doc.setFontSize(12)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("TOTAL:", rightX - 30, yPos)
    this.doc.text(this.formatCurrency(data.totales.total), rightX, yPos, { align: "right" })

    // Monto en letras
    yPos += 15
    this.doc.setFontSize(9)
    this.doc.setFont("helvetica", "italic")
    this.doc.text(`Son: ${data.totales.montoLetras}`, this.margin, yPos)

    return yPos + 10
  }

  private addFooter(data: InvoiceData, startY: number) {
    if (data.comprobante.observaciones) {
      this.doc.setFontSize(9)
      this.doc.setFont("helvetica", "normal")
      this.doc.text("Observaciones:", this.margin, startY)

      const splitText = this.doc.splitTextToSize(data.comprobante.observaciones, this.pageWidth - this.margin * 2)
      this.doc.text(splitText, this.margin, startY + 6)
    }

    // Información legal en el pie de página
    const footerY = this.pageHeight - 20
    this.doc.setFontSize(8)
    this.doc.setFont("helvetica", "normal")
    this.doc.text(
      "Este documento fue generado electrónicamente de acuerdo a la normativa de la DGII",
      this.pageWidth / 2,
      footerY,
      { align: "center" },
    )
  }

  private getTipoComprobanteText(tipo: string): string {
    const tipos: { [key: string]: string } = {
      "01": "FACTURA DE CRÉDITO FISCAL",
      "02": "FACTURA DE CONSUMO",
      "03": "NOTA DE DÉBITO",
      "04": "NOTA DE CRÉDITO",
      "11": "COMPROBANTE DE COMPRAS",
      "12": "REGISTRO ÚNICO DE INGRESOS",
      "13": "COMPROBANTE MENOR CUANTÍA",
      "14": "COMPROBANTE PARA PAGOS AL EXTERIOR",
      "15": "COMPROBANTE GUBERNAMENTAL",
      "16": "COMPROBANTE DE EXPORTACIÓN",
      "17": "COMPROBANTE PARA PAGOS AL EXTERIOR",
    }
    return tipos[tipo] || "COMPROBANTE FISCAL"
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: "DOP",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  public generate(data: InvoiceData): jsPDF {
    try {
      let currentY = this.margin

      // Agregar secciones del PDF
      currentY = this.addHeader(data)
      currentY = this.addReceptorInfo(data, currentY)
      currentY = this.addItemsTable(data, currentY)
      currentY = this.addTotals(data, currentY)
      this.addFooter(data, currentY)

      logger.info("PDF generado exitosamente", {
        ncf: data.comprobante.ncf,
        emisor: data.emisor.rnc,
      })

      return this.doc
    } catch (error) {
      logger.error("Error generando PDF", { error, data })
      throw error
    }
  }

  public save(filename: string) {
    this.doc.save(filename)
  }

  public output(type: "blob" | "datauristring" | "datauri" = "blob") {
    return this.doc.output(type)
  }
}

// Función de conveniencia para generar PDF de factura
export function generateInvoicePDF(data: InvoiceData): jsPDF {
  const generator = new PDFGenerator()
  return generator.generate(data)
}

// Función para convertir número a letras (básica)
export function numeroALetras(numero: number): string {
  const unidades = ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"]
  const decenas = ["", "", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"]
  const centenas = [
    "",
    "ciento",
    "doscientos",
    "trescientos",
    "cuatrocientos",
    "quinientos",
    "seiscientos",
    "setecientos",
    "ochocientos",
    "novecientos",
  ]

  if (numero === 0) return "cero pesos"
  if (numero === 1) return "un peso"

  let resultado = ""

  // Simplificación básica - en producción usar una librería completa
  if (numero < 10) {
    resultado = unidades[numero]
  } else if (numero < 100) {
    const dec = Math.floor(numero / 10)
    const uni = numero % 10
    resultado = decenas[dec] + (uni > 0 ? " y " + unidades[uni] : "")
  } else {
    resultado = numero.toString() // Fallback para números grandes
  }

  return resultado + (numero === 1 ? " peso" : " pesos")
}
