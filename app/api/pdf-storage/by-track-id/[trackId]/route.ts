import { type NextRequest, NextResponse } from "next/server"
import { PDFStorageService } from "@/lib/pdf-storage-service"

export async function GET(request: NextRequest, { params }: { params: { trackId: string } }) {
  try {
    const trackId = params.trackId
    const { searchParams } = new URL(request.url)
    const tipoPdf = (searchParams.get("tipo") as "preview" | "final") || "final"

    if (!trackId) {
      return NextResponse.json({ error: "TrackID is required" }, { status: 400 })
    }

    const storageService = new PDFStorageService()
    const result = await storageService.getPDFByTrackId(trackId, tipoPdf)

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error,
        },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      pdf: result.record,
      download_url: `/api/pdf-storage/retrieve/${result.record?.id}`,
      expires_at: result.record?.fecha_expiracion,
      downloads_remaining: Math.max(0, 10 - (result.record?.descargas_count || 0)),
    })
  } catch (error) {
    console.error("Unexpected error getting PDF by TrackID:", error)
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
