import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

interface ApiResponse {
  success: boolean
  message?: string
  data?: any
  error?: string
  errors?: string[]
}

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const supabase = await createClient()

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "No autorizado",
          errors: ["Usuario no autenticado"],
        },
        { status: 401 },
      )
    }

    // Obtener empresa del usuario
    const { data: empresa, error: empresaError } = await supabase
      .from("empresas")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (empresaError || !empresa) {
      return NextResponse.json(
        {
          success: false,
          error: "Empresa no encontrada",
          errors: ["No se encontró la empresa asociada al usuario"],
        },
        { status: 404 },
      )
    }

    // Obtener estadísticas de comprobantes fiscales
    const { data: comprobantes, error: errorComprobantes } = await supabase
      .from("comprobantes_fiscales")
      .select("estado_dgii, monto_total, created_at")
      .eq("empresa_id", empresa.id)

    if (errorComprobantes) {
      return NextResponse.json(
        {
          success: false,
          error: errorComprobantes.message,
          errors: ["Error al obtener estadísticas"],
        },
        { status: 500 },
      )
    }

    // Calcular estadísticas actuales
    const totalEmitidos = comprobantes?.length || 0
    const aceptados = comprobantes?.filter((c) => c.estado_dgii === "aceptado").length || 0
    const rechazados = comprobantes?.filter((c) => c.estado_dgii === "rechazado").length || 0
    const enProceso = comprobantes?.filter((c) => c.estado_dgii === "emitido").length || 0
    const montoTotal = comprobantes?.reduce((sum, c) => sum + (c.monto_total || 0), 0) || 0

    // Calcular estadísticas del mes anterior para comparación
    const fechaActual = new Date()
    const mesAnterior = new Date(fechaActual.getFullYear(), fechaActual.getMonth() - 1, 1)
    const inicioMesActual = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1)

    const comprobantesMesAnterior =
      comprobantes?.filter((c) => {
        const fecha = new Date(c.created_at)
        return fecha >= mesAnterior && fecha < inicioMesActual
      }) || []

    const comprobantesMesActual =
      comprobantes?.filter((c) => {
        const fecha = new Date(c.created_at)
        return fecha >= inicioMesActual
      }) || []

    // Calcular cambios porcentuales
    const calcularCambio = (actual: number, anterior: number) => {
      if (anterior === 0) return actual > 0 ? 100 : 0
      return ((actual - anterior) / anterior) * 100
    }

    const totalAnterior = comprobantesMesAnterior.length
    const aceptadosAnterior = comprobantesMesAnterior.filter((c) => c.estado_dgii === "aceptado").length
    const rechazadosAnterior = comprobantesMesAnterior.filter((c) => c.estado_dgii === "rechazado").length
    const montoAnterior = comprobantesMesAnterior.reduce((sum, c) => sum + (c.monto_total || 0), 0)

    const totalActual = comprobantesMesActual.length
    const aceptadosActual = comprobantesMesActual.filter((c) => c.estado_dgii === "aceptado").length
    const rechazadosActual = comprobantesMesActual.filter((c) => c.estado_dgii === "rechazado").length
    const montoActual = comprobantesMesActual.reduce((sum, c) => sum + (c.monto_total || 0), 0)

    const stats = {
      totalEmitidos: {
        valor: totalEmitidos,
        cambio: calcularCambio(totalActual, totalAnterior),
        tendencia: totalActual >= totalAnterior ? "up" : "down",
      },
      aceptados: {
        valor: aceptados,
        cambio: calcularCambio(aceptadosActual, aceptadosAnterior),
        tendencia: aceptadosActual >= aceptadosAnterior ? "up" : "down",
      },
      rechazados: {
        valor: rechazados,
        cambio: calcularCambio(rechazadosActual, rechazadosAnterior),
        tendencia: rechazadosActual <= rechazadosAnterior ? "up" : "down", // Menos rechazados es mejor
      },
      enProceso: {
        valor: enProceso,
        cambio: 0, // En proceso no tiene tendencia histórica relevante
        tendencia: "neutral" as const,
      },
      montoTotal: {
        valor: montoTotal,
        cambio: calcularCambio(montoActual, montoAnterior),
        tendencia: montoActual >= montoAnterior ? "up" : "down",
      },
    }

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error("Error obteniendo estadísticas:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
        errors: ["Error inesperado al obtener estadísticas"],
      },
      { status: 500 },
    )
  }
}
