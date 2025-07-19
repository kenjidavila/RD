import { NextResponse } from "next/server"
import { MonitoringService } from "@/lib/monitoring-service"

export async function GET() {
  try {
    const [metricas, salud] = await Promise.all([
      MonitoringService.obtenerMetricas(),
      MonitoringService.verificarSaludSistema(),
    ])

    return NextResponse.json({
      success: true,
      data: {
        metricas,
        salud,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("Error obteniendo salud del sistema:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}
