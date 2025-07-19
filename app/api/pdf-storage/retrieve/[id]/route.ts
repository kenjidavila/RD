import { type NextRequest, NextResponse } from "next/server"
import { PDFStorageService } from "@/lib/pdf-storage-service"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const pdfId = params.id

    if (!pdfId) {
      return NextResponse.json({ error: "PDF ID is required" }, { status: 400 })
    }

    // Obtener userId del header o contexto de autenticación
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ error: "User authentication required" }, { status: 401 })
    }

    const storageService = new PDFStorageService()
    const result = await storageService.retrievePDF(pdfId, userId)

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error,
        },
        { status: 404 },
      )
    }

    if (!result.pdfBuffer || !result.record) {
      return NextResponse.json({ error: "PDF data not available" }, { status: 500 })
    }

    // Retornar PDF con headers apropiados
    return new NextResponse(result.pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${result.record.filename}"`,
        "Content-Length": result.pdfBuffer.length.toString(),
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-Download-Options": "noopen",
        "X-PDF-Type": result.record.tipo_pdf,
        "X-TrackID": result.record.track_id,
        "X-Downloads-Count": result.record.descargas_count.toString(),
        "X-Expires-At": result.record.fecha_expiracion,
      },
    })
  } catch (error) {
    console.error("Unexpected error retrieving PDF:", error)
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
