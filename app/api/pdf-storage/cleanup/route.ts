import { type NextRequest, NextResponse } from "next/server"
import { PDFStorageService } from "@/lib/pdf-storage-service"

export async function POST(request: NextRequest) {
  try {
    // Verificar autorización (solo administradores o sistema)
    const authHeader = request.headers.get("authorization")
    const apiKey = request.headers.get("x-api-key")

    // En producción, validar que sea una llamada autorizada
    if (!authHeader && !apiKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const storageService = new PDFStorageService()
    const result = await storageService.cleanupExpiredPDFs()

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Cleanup completed successfully",
      cleaned_count: result.cleaned || 0,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Unexpected error in cleanup:", error)
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
    service: "PDF Cleanup API",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  })
}
