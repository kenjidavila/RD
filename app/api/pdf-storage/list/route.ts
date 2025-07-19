import { type NextRequest, NextResponse } from "next/server"
import { PDFStorageService } from "@/lib/pdf-storage-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Obtener userId del header o contexto de autenticación
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ error: "User authentication required" }, { status: 401 })
    }

    // Parsear filtros de query parameters
    const filters = {
      tipo_pdf: searchParams.get("tipo_pdf") as "preview" | "final" | undefined,
      estado: searchParams.get("estado") as "disponible" | "descargado" | "expirado" | undefined,
      desde: searchParams.get("desde") || undefined,
      hasta: searchParams.get("hasta") || undefined,
      limit: searchParams.get("limit") ? Number.parseInt(searchParams.get("limit")!) : 20,
      offset: searchParams.get("offset") ? Number.parseInt(searchParams.get("offset")!) : 0,
    }

    const storageService = new PDFStorageService()
    const result = await storageService.listUserPDFs(userId, filters)

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
      pdfs: result.pdfs || [],
      total: result.total || 0,
      filters,
      pagination: {
        limit: filters.limit,
        offset: filters.offset,
        has_more: (result.total || 0) > filters.offset + filters.limit,
      },
    })
  } catch (error) {
    console.error("Unexpected error listing PDFs:", error)
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
