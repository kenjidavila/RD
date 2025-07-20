import { type NextRequest, NextResponse } from "next/server"
import { PDFStorageService } from "@/lib/pdf-storage-service"
import { PDFGenerator } from "@/lib/pdf-generator"
import { ECFDataMapper } from "@/lib/ecf-data-mapper"
import { SupabaseServerUtils } from "@/lib/supabase-server-utils"
import type { PDFGenerationRequest } from "@/types/ecf-types"

export async function POST(request: NextRequest) {
  try {
    const body: PDFGenerationRequest = await request.json()
    const { ecfData, empresaData: bodyEmpresa, tipo = "final" } = body

    // Validar datos de entrada
    if (!ecfData || typeof ecfData !== "object") {
      return NextResponse.json({ error: "ECF data is required and must be a valid object" }, { status: 400 })
    }

    // Obtener usuario y empresa asociada
    const { user, empresa } = await SupabaseServerUtils.getSessionAndEmpresa()
    const empresaData = bodyEmpresa && typeof bodyEmpresa === "object" ? { ...bodyEmpresa } : {
      id: empresa.id,
      rnc: empresa.rnc,
      razonSocial: empresa.razon_social,
    }

    // Para PDFs finales, validar que tengan trackId
    if (tipo === "final" && !ecfData.trackId) {
      return NextResponse.json({ error: "TrackID is required for final PDF storage" }, { status: 400 })
    }

    const userId = user.id

    // Validar integridad de datos
    const validation = ECFDataMapper.validateECFData(ecfData)
    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: "Invalid ECF data",
          details: validation.errors.join("; "),
          validationErrors: validation.errors,
        },
        { status: 400 },
      )
    }

    // Sanitizar datos
    const sanitizedData = ECFDataMapper.sanitizeECFData(ecfData)

    // Generar PDF
    const pdfGenerator = new PDFGenerator()
    await pdfGenerator.loadPersonalizacionConfig()

    let pdfBuffer: Uint8Array
    try {
      pdfBuffer = await Promise.race([
        Promise.resolve(pdfGenerator.generateECFPDF(sanitizedData, empresaData, tipo)),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("PDF generation timeout")), 30000)),
      ])
    } catch (pdfError) {
      console.error("PDF generation failed:", pdfError)
      return NextResponse.json(
        {
          error: "Failed to generate PDF",
          details: pdfError instanceof Error ? pdfError.message : "Unknown error",
        },
        { status: 500 },
      )
    }

    // Almacenar PDF
    const storageService = new PDFStorageService()
    const storeResult = await storageService.storePDF(pdfBuffer, sanitizedData, empresaData, userId, tipo)

    if (!storeResult.success) {
      return NextResponse.json(
        {
          error: "Failed to store PDF",
          details: storeResult.error,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "PDF generated and stored successfully",
      pdf_id: storeResult.record?.id,
      filename: storeResult.record?.filename,
      expires_at: storeResult.record?.fecha_expiracion,
      storage_path: storeResult.record?.storage_path,
      file_size: storeResult.record?.file_size,
      tipo_pdf: tipo,
      track_id: sanitizedData.trackId,
      e_ncf: sanitizedData.eNCF,
    })
  } catch (error) {
    console.error("Unexpected error in PDF storage:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? (error as Error).message : "An unexpected error occurred",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    service: "PDF Storage API",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  })
}
