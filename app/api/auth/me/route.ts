import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { logger } from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    // Obtener información completa del usuario si existe
    const { data: usuario, error: usuarioError } = await supabase
      .from("usuarios")
      .select(
        `*, empresas ( id, rnc, razon_social, nombre_comercial, email, telefono, direccion, provincia, municipio, activa )`,
      )
      .eq("auth_user_id", user.id)
      .maybeSingle()

    if (usuarioError) {
      logger.error("Error obteniendo datos de usuario", {
        error: usuarioError,
        userId: user.id,
      })
    }

    return NextResponse.json({
      user,
      usuario,
    })
  } catch (error) {
    logger.error("Error en /auth/me", { error })
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
