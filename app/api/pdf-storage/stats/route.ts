import { type NextRequest, NextResponse } from "next/server"
import { PDFStorageService } from "@/lib/pdf-storage-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    // Puede recibirse empresa_id para validaciones futuras
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ error: "User authentication required" }, { status: 401 })
    }

    const storageService = new PDFStorageService()
    const result = await storageService.getStorageStats(userId)

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
      stats: result.stats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Unexpected error getting storage stats:", error)
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
