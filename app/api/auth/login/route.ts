import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { logger } from "@/lib/logger"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email y contraseña son requeridos" }, { status: 400 })
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      logger.warn("Intento de login fallido", { email, error: error.message })
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 })
    }

    if (!data.user) {
      return NextResponse.json({ error: "Error en autenticación" }, { status: 401 })
    }

    // Obtener información del usuario y empresa
    const { data: usuario, error: usuarioError } = await supabase
      .from("usuarios")
      .select(`
        *,
        empresas (
          id,
          rnc,
          razon_social,
          nombre_comercial,
          activa
        )
      `)
      .eq("auth_user_id", data.user.id)
      .single()

    if (usuarioError || !usuario) {
      logger.warn("Datos de usuario no encontrados", {
        error: usuarioError,
        userId: data.user.id,
      })
      return NextResponse.json({ error: "No se encontraron datos de usuario" }, { status: 400 })
    }

    logger.info("Login exitoso", {
      userId: data.user.id,
      email,
      empresaId: usuario.empresa_id,
    })

    return NextResponse.json({
      message: "Login exitoso",
      data: {
        user: data.user,
        usuario,
        session: data.session,
      },
    })
  } catch (error) {
    logger.error("Error en login", { error })
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
