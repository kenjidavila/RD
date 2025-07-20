import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

interface ApiResponse {
  success: boolean
  message?: string
  data?: any
  error?: string
  errors?: string[]
}

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const supabase = await createClient()

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "No autorizado",
          errors: ["Usuario no autenticado"],
        },
        { status: 401 },
      )
    }

    // Obtener empresa del usuario
    const { data: usuario, error: usuarioError } = await supabase
      .from("usuarios")
      .select("empresa_id")
      .eq("auth_user_id", user.id)
      .single()

    if (usuarioError || !usuario) {
      return NextResponse.json(
        {
          success: false,
          error: "Empresa no encontrada",
          errors: ["No se encontró la empresa asociada al usuario"],
        },
        { status: 404 },
      )
    }

    const empresaId = usuario.empresa_id

    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get("tipo")

    let query = supabase.from("configuraciones").select("*").eq("empresa_id", empresaId)

    if (tipo) {
      query = query.eq("tipo", tipo)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          errors: ["Error al obtener configuraciones"],
        },
        { status: 500 },
      )
    }

    // Convertir array a objeto con tipo como clave
    const configuraciones: Record<string, any> = {}
    data?.forEach((config) => {
      configuraciones[config.tipo] = config.configuracion
    })

    return NextResponse.json({
      success: true,
      data: configuraciones,
    })
  } catch (error) {
    console.error("Error obteniendo configuración:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
        errors: ["Error inesperado al obtener configuraciones"],
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const supabase = await createClient()

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "No autorizado",
          errors: ["Usuario no autenticado"],
        },
        { status: 401 },
      )
    }

    // Obtener empresa del usuario
    const { data: usuario, error: usuarioError } = await supabase
      .from("usuarios")
      .select("empresa_id")
      .eq("auth_user_id", user.id)
      .single()

    if (usuarioError || !usuario) {
      return NextResponse.json(
        {
          success: false,
          error: "Empresa no encontrada",
          errors: ["No se encontró la empresa asociada al usuario"],
        },
        { status: 404 },
      )
    }

    const empresaId = usuario.empresa_id

    const body = await request.json()
    const { tipo, configuracion } = body

    if (!tipo || !configuracion) {
      return NextResponse.json(
        {
          success: false,
          error: "Datos requeridos faltantes",
          errors: ["Tipo y configuración son requeridos"],
        },
        { status: 400 },
      )
    }

    const { data, error } = await supabase
      .from("configuraciones")
      .upsert({
        empresa_id: empresaId,
        tipo,
        configuracion,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          errors: ["Error al guardar configuración"],
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Configuración guardada exitosamente",
      data,
    })
  } catch (error) {
    console.error("Error guardando configuración:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
        errors: ["Error inesperado al guardar configuración"],
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const supabase = await createClient()

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "No autorizado",
          errors: ["Usuario no autenticado"],
        },
        { status: 401 },
      )
    }

    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get("tipo")

    if (!tipo) {
      return NextResponse.json(
        {
          success: false,
          error: "Tipo requerido",
          errors: ["El tipo de configuración es requerido"],
        },
        { status: 400 },
      )
    }

    // Obtener empresa del usuario
    const { data: usuario, error: usuarioError } = await supabase
      .from("usuarios")
      .select("empresa_id")
      .eq("auth_user_id", user.id)
      .single()

    if (usuarioError || !usuario) {
      return NextResponse.json(
        {
          success: false,
          error: "Empresa no encontrada",
          errors: ["No se encontró la empresa asociada al usuario"],
        },
        { status: 404 },
      )
    }

    const empresaId = usuario.empresa_id

    const { error } = await supabase
      .from("configuraciones")
      .delete()
      .eq("empresa_id", empresaId)
      .eq("tipo", tipo)

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          errors: ["Error al eliminar configuración"],
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Configuración eliminada exitosamente",
    })
  } catch (error) {
    console.error("Error eliminando configuración:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
        errors: ["Error inesperado al eliminar configuración"],
      },
      { status: 500 },
    )
  }
}
