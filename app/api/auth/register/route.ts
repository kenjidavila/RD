import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient, createClient } from "@/utils/supabase/server"
import { logger } from "@/lib/logger"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const admin = createAdminClient()
    const { email, password, nombre, rnc, razonSocial } = await request.json()

    if (!email || !password || !nombre || !rnc || !razonSocial) {
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 })
    }

    // Registrar usuario utilizando signUp
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Enviar metadata adicional pero evitar requerir confirmación por email
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

    const userId = authData?.user?.id
    if (!userId) {
      return NextResponse.json({ error: "Error al crear usuario" }, { status: 400 })
    }

    // Si no se obtuvo sesión (por ejemplo, si se requiere confirmación de correo),
    // intentar iniciar sesión para obtenerla y que RLS permita las inserciones
    if (!authData.session) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        await admin.auth.admin.deleteUser(userId)
        return NextResponse.json(
          { error: "No se pudo establecer la sesión" },
          { status: 400 },
        )
      }
    }

    const { data: empresaData, error: empresaError } = await supabase
      .from("empresas")
      .insert({
        user_id: userId,
        rnc,
        razon_social: razonSocial,
        activa: true,
      })
      .select()
      .single()

    if (empresaError) {
      logger.error("Error creando empresa", { error: empresaError, rnc })
      await admin.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: "Error al crear empresa: " + empresaError.message }, { status: 400 })
    }

    const { error: perfilError } = await supabase.from("usuarios").insert({
      auth_user_id: userId,
      empresa_id: empresaData.id,
      rnc_cedula: rnc,
      nombre,
      email,
      rol: "administrador",
      activo: true,
    })

    if (perfilError) {
      logger.error("Error creando perfil de usuario", { error: perfilError, userId })
      await admin.auth.admin.deleteUser(userId)
      await supabase.from("empresas").delete().eq("id", empresaData.id)
      return NextResponse.json({ error: "Error al crear perfil: " + perfilError.message }, { status: 400 })
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
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
