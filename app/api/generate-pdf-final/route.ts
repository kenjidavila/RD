import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { generateInvoicePDF, type InvoiceData } from "@/lib/pdf-generator"
import { logger } from "@/lib/logger"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const invoiceData: InvoiceData = await request.json()

    // Validar datos requeridos
    if (!invoiceData.emisor || !invoiceData.receptor || !invoiceData.comprobante || !invoiceData.items) {
      return NextResponse.json({ error: "Datos de factura incompletos" }, { status: 400 })
    }

    // Generar PDF
    const pdf = generateInvoicePDF(invoiceData)
    const pdfBuffer = pdf.output("arraybuffer")

    logger.info("PDF generado exitosamente", {
      userId: user.id,
      ncf: invoiceData.comprobante.ncf,
      emisorRnc: invoiceData.emisor.rnc,
    })

    // Retornar PDF como respuesta
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="factura-${invoiceData.comprobante.ncf}.pdf"`,
        "Content-Length": pdfBuffer.byteLength.toString(),
      },
    })
  } catch (error) {
    logger.error("Error generando PDF", { error })
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
