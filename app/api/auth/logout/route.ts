import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { logger } from "@/lib/logger"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Obtener usuario actual antes del logout
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const userId = user?.id

    const { error } = await supabase.auth.signOut()

    if (error) {
      logger.error("Error en logout", { error, userId })
      return NextResponse.json({ error: "Error al cerrar sesión" }, { status: 500 })
    }

    logger.info("Logout exitoso", { userId })

    return NextResponse.json({
      message: "Sesión cerrada exitosamente",
    })
  } catch (error) {
    logger.error("Error en logout", { error })
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
