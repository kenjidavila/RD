import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { logger } from "@/lib/logger"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: "Email y contraseña son requeridos",
      }, { status: 400 })
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      logger.warn("Intento de login fallido", { email, error: error.message })
      return NextResponse.json({
        success: false,
        error: "Credenciales inválidas",
      }, { status: 401 })
    }

    if (!data.user) {
      return NextResponse.json({ success: false, error: "Error en autenticación" }, { status: 401 })
    }

    // Obtener información del usuario y empresa si existe
    const { data: usuario, error: usuarioError } = await supabase
      .from("usuarios")
      .select(
        `*, empresas ( id, rnc, razon_social, nombre_comercial, activa )`,
      )
      .eq("id", data.user.id)
      .maybeSingle()

    if (usuarioError) {
      logger.error("Error obteniendo datos de usuario", {
        error: usuarioError,
        userId: data.user.id,
      })
    }

    logger.info("Login exitoso", {
      userId: data.user.id,
      email,
    })

    return NextResponse.json({
      success: true,
      message: "Login exitoso",
      data: {
        user: data.user,
        usuario: usuario ?? null,
        session: data.session,
      },
    })
  } catch (error) {
    logger.error("Error en login", { error })
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}
