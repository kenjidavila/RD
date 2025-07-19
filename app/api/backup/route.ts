import { type NextRequest, NextResponse } from "next/server"
import { BackupService } from "@/lib/backup-service"

export async function POST(request: NextRequest) {
  try {
    // Check if environment variables are available
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json(
        {
          success: false,
          error: "Servicio de base de datos no configurado",
        },
        { status: 503 },
      )
    }

    // For now, return a mock response since we don't have authentication set up
    const mockUserId = "mock-user-id"

    const result = await BackupService.crearBackupCompleto(mockUserId)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Backup creado exitosamente",
        backupId: result.backupId,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error en backup:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check if environment variables are available
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json(
        {
          success: false,
          error: "Servicio de base de datos no configurado",
        },
        { status: 503 },
      )
    }

    // For now, return a mock response
    const mockUserId = "mock-user-id"

    const result = await BackupService.listarBackups(mockUserId)

    if (result.success) {
      return NextResponse.json({
        success: true,
        backups: result.backups,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error listando backups:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}
