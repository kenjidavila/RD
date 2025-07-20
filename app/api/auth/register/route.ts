import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"
import { logger } from "@/lib/logger"

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { email, password, nombre, apellidos, rnc, razonSocial } = await request.json()

    if (!email || !password || !nombre || !apellidos || !rnc || !razonSocial) {
        return NextResponse.json({
          success: false,
          error: "Todos los campos son requeridos",
        }, { status: 400 })
      }

    // Registrar usuario desde Admin Client
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nombre,
        apellidos,
        rnc,
        razon_social: razonSocial,
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
      await supabase.auth.admin.deleteUser(userId)
      return NextResponse.json({
        success: false,
        error: "Error al crear empresa: " + empresaError.message,
      }, { status: 400 })
    }

    const { error: perfilError } = await supabase.from("usuarios").insert({
      id: userId,
      empresa_id: empresaData.id,
      rnc_cedula: rnc,
      nombre,
      email,
      rol: "administrador",
      activo: true,
    })

    if (perfilError) {
      logger.error("Error creando perfil de usuario", { error: perfilError, userId })
      await supabase.from("empresas").delete().eq("id", empresaData.id)
      await supabase.auth.admin.deleteUser(userId)
      return NextResponse.json({
        success: false,
        error: "Error al crear perfil: " + perfilError.message,
      }, { status: 400 })
    }

    logger.info("Usuario registrado exitosamente", { userId, email, empresaId: empresaData.id })

    return NextResponse.json({
      success: true,
      message: "Usuario registrado exitosamente",
      data: {
        userId,
        empresa: empresaData,
      },
    })
  } catch (error) {
    logger.error("Error en registro", { error })
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}
