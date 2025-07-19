import { type NextRequest, NextResponse } from "next/server"
import { obtenerSesionesActivas, cerrarSesionEspecifica } from "@/lib/auth-service"

// Obtener sesiones activas del usuario
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Usuario no autenticado",
          errors: ["ID de usuario no encontrado"],
        },
        { status: 401 },
      )
    }

    const resultado = await obtenerSesionesActivas(userId)

    if (!resultado.success) {
      return NextResponse.json(resultado, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: "Sesiones obtenidas exitosamente",
      data: resultado.data,
    })
  } catch (error) {
    console.error("Error obteniendo sesiones:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error interno del servidor",
        errors: ["Error inesperado obteniendo sesiones"],
      },
      { status: 500 },
    )
  }
}

// Cerrar sesión específica
export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("session_id")

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Usuario no autenticado",
          errors: ["ID de usuario no encontrado"],
        },
        { status: 401 },
      )
    }

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          message: "ID de sesión requerido",
          errors: ["session_id es requerido"],
        },
        { status: 400 },
      )
    }

    const resultado = await cerrarSesionEspecifica(userId, sessionId)

    if (!resultado.success) {
      return NextResponse.json(resultado, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: "Sesión cerrada exitosamente",
    })
  } catch (error) {
    console.error("Error cerrando sesión específica:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error interno del servidor",
        errors: ["Error inesperado cerrando sesión"],
      },
      { status: 500 },
    )
  }
}
