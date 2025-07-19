import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener estado de certificados digitales reales
    const { data: certificados, error: errorCertificados } = await supabase
      .from("certificados_digitales")
      .select("fecha_vencimiento, activo")
      .eq("empresa_id", user.id)

    if (errorCertificados) {
      console.error("Error obteniendo certificados:", errorCertificados)
    }

    // Calcular estado de certificados
    const hoy = new Date()
    const certificatesStatus = {
      total: certificados?.length || 0,
      activos: certificados?.filter((c) => c.activo).length || 0,
      porVencer: 0,
      vencidos: 0,
      diasParaVencimiento: undefined as number | undefined,
    }

    if (certificados && certificados.length > 0) {
      let menorDiasParaVencer = Number.POSITIVE_INFINITY

      certificados.forEach((cert) => {
        const fechaVencimiento = new Date(cert.fecha_vencimiento)
        const diffTime = fechaVencimiento.getTime() - hoy.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays < 0) {
          certificatesStatus.vencidos++
        } else if (diffDays <= 30) {
          certificatesStatus.porVencer++
          if (diffDays < menorDiasParaVencer) {
            menorDiasParaVencer = diffDays
          }
        }
      })

      if (menorDiasParaVencer !== Number.POSITIVE_INFINITY) {
        certificatesStatus.diasParaVencimiento = menorDiasParaVencer
      }
    }

    // Simular verificación de estado DGII (en producción esto sería una llamada real)
    const dgiiStatus = await checkDGIIStatus()

    const systemStatus = {
      dgiiStatus: dgiiStatus.status,
      lastCheck: new Date().toISOString(),
      certificates: certificatesStatus,
    }

    return NextResponse.json({ success: true, data: systemStatus })
  } catch (error) {
    console.error("Error obteniendo estado del sistema:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

// Función para verificar el estado de DGII
async function checkDGIIStatus(): Promise<{ status: "online" | "offline" | "maintenance" }> {
  try {
    // En producción, esto haría una llamada real a los servicios DGII
    // Por ahora simulamos una verificación básica
    const response = await fetch("https://dgii.gov.do", {
      method: "HEAD",
      signal: AbortSignal.timeout(5000), // 5 segundos timeout
    })

    if (response.ok) {
      return { status: "online" }
    } else {
      return { status: "offline" }
    }
  } catch (error) {
    console.error("Error verificando estado DGII:", error)
    return { status: "offline" }
  }
}
