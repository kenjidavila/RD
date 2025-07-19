import { type NextRequest, NextResponse } from "next/server"
import { PDFGenerator } from "@/lib/pdf-generator"
import { ECFDataMapper } from "@/lib/ecf-data-mapper"
import type { PDFGenerationRequest } from "@/types/ecf-types"

export async function POST(request: NextRequest) {
  try {
    const body: PDFGenerationRequest = await request.json()
    const { ecfData, empresaData, filename } = body

    // Validar datos de entrada
    if (!ecfData || typeof ecfData !== "object") {
      return NextResponse.json({ error: "ECF data is required and must be a valid object" }, { status: 400 })
    }

    if (!empresaData || typeof empresaData !== "object") {
      return NextResponse.json({ error: "Company data is required and must be a valid object" }, { status: 400 })
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

    // Preparar datos para preview
    const previewData = ECFDataMapper.prepareForPreview(ecfData)

    // Crear PDF generator instance
    const pdfGenerator = new PDFGenerator()

    // Cargar configuración de personalización
    try {
      await pdfGenerator.loadPersonalizacionConfig()
    } catch (configError) {
      console.error("Error loading personalization config:", configError)
      // Continuar con configuración por defecto
    }

    // Generar PDF preview
    let pdfBuffer: Uint8Array
    try {
      pdfBuffer = await Promise.race([
        Promise.resolve(pdfGenerator.generateECFPDF(previewData, empresaData, "preview")),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("PDF generation timeout")), 30000)),
      ])
    } catch (pdfError) {
      console.error("Preview PDF generation failed:", pdfError)
      const error = pdfError as Error

      return NextResponse.json(
        {
          error: "Failed to generate preview PDF",
          details: error.message,
        },
        { status: 500 },
      )
    }

    // Validar PDF buffer
    if (!pdfBuffer || pdfBuffer.length === 0) {
      return NextResponse.json({ error: "Generated PDF is empty or invalid" }, { status: 500 })
    }

    // Generar nombre de archivo para preview
    const sanitizeFilename = (name: string): string => {
      return name
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .replace(/_{2,}/g, "_")
        .replace(/^_|_$/g, "")
        .substring(0, 200)
    }

    const previewFilename = filename
      ? sanitizeFilename(`PREVIEW_${filename}`)
      : sanitizeFilename(`PREVIEW_e-CF_${previewData.eNCF}_${Date.now()}.pdf`)

    const filenameWithExtension = previewFilename.endsWith(".pdf") ? previewFilename : `${previewFilename}.pdf`

    // Retornar PDF con headers apropiados para preview
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filenameWithExtension}"`,
        "Content-Length": pdfBuffer.length.toString(),
        "Cache-Control": "no-cache, no-store, must-revalidate", // No cacheable para previews
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "SAMEORIGIN", // Permitir iframe para preview
        "X-Download-Options": "noopen",
        "X-PDF-Type": "preview",
        "X-Preview-Code": previewData.codigoSeguridad || "",
      },
    })
  } catch (error) {
    console.error("Unexpected error in preview PDF generation:", error)

    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 })
    }

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

    return NextResponse.json(
      {
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? errorMessage : "An unexpected error occurred",
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    service: "PDF Preview Generation API",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  })
}
