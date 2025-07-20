import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"
import { logger } from "@/lib/logger"

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { email, password, nombre, apellidos } = await request.json()

    if (!email || !password || !nombre || !apellidos) {
      return NextResponse.json(
        {
          success: false,
          error: "Todos los campos son requeridos",
        },
        { status: 400 },
      )
    }

    // Registrar usuario desde Admin Client
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nombre,
        apellidos,
      },
    })

    if (authError) {
      logger.error("Error en registro de usuario", { error: authError, email })
      return NextResponse.json({
        success: false,
        error: "Error al registrar usuario: " + authError.message,
      }, { status: 400 })
    }

    const userId = authData?.user?.id
    if (!userId) {
      return NextResponse.json({ success: false, error: "Error al crear usuario" }, { status: 400 })
    }

    logger.info("Usuario registrado exitosamente", { userId, email })

    return NextResponse.json({
      success: true,
      message: "Usuario registrado exitosamente",
      data: {
        userId,
      },
    })
  } catch (error) {
    logger.error("Error en registro", { error })
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}
