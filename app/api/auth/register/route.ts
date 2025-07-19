import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { logger } from "@/lib/logger"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { email, password, nombre, rnc, razonSocial } = await request.json()

    // Validar datos requeridos
    if (!email || !password || !nombre || !rnc || !razonSocial) {
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 })
    }

    // Registrar usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre,
          rnc,
          razon_social: razonSocial,
        },
      },
    })

    if (authError) {
      logger.error("Error en registro de usuario", { error: authError, email })
      return NextResponse.json({ error: "Error al registrar usuario: " + authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Error al crear usuario" }, { status: 400 })
    }

    // Crear empresa
    const { data: empresaData, error: empresaError } = await supabase
      .from("empresas")
      .insert({
        rnc,
        razon_social: razonSocial,
        activa: true,
      })
      .select()
      .single()

    if (empresaError) {
      logger.error("Error creando empresa", { error: empresaError, rnc })
      return NextResponse.json({ error: "Error al crear empresa: " + empresaError.message }, { status: 400 })
    }

    // Crear perfil de usuario
    const { error: perfilError } = await supabase.from("usuarios").insert({
      id: authData.user.id,
      empresa_id: empresaData.id,
      rnc_cedula: rnc,
      nombre,
      email,
      rol: "administrador",
      activo: true,
    })

    if (perfilError) {
      logger.error("Error creando perfil de usuario", { error: perfilError, userId: authData.user.id })
      return NextResponse.json({ error: "Error al crear perfil: " + perfilError.message }, { status: 400 })
    }

    logger.info("Usuario registrado exitosamente", {
      userId: authData.user.id,
      email,
      empresaId: empresaData.id,
    })

    return NextResponse.json({
      message: "Usuario registrado exitosamente",
      user: authData.user,
      empresa: empresaData,
    })
  } catch (error) {
    logger.error("Error en registro", { error })
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
