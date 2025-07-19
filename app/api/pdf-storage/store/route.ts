import { type NextRequest, NextResponse } from "next/server"
import { PDFStorageService } from "@/lib/pdf-storage-service"
import { PDFGenerator } from "@/lib/pdf-generator"
import { ECFDataMapper } from "@/lib/ecf-data-mapper"
import type { PDFGenerationRequest } from "@/types/ecf-types"

export async function POST(request: NextRequest) {
  try {
    const body: PDFGenerationRequest = await request.json()
    const { ecfData, empresaData, tipo = "final" } = body

    // Validar datos de entrada
    if (!ecfData || typeof ecfData !== "object") {
      return NextResponse.json({ error: "ECF data is required and must be a valid object" }, { status: 400 })
    }

    if (!empresaData || typeof empresaData !== "object") {
      return NextResponse.json({ error: "Company data is required and must be a valid object" }, { status: 400 })
    }

    // Para PDFs finales, validar que tengan trackId
    if (tipo === "final" && !ecfData.trackId) {
      return NextResponse.json({ error: "TrackID is required for final PDF storage" }, { status: 400 })
    }

    // Obtener userId del header o contexto de autenticación
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ error: "User authentication required" }, { status: 401 })
    }

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
