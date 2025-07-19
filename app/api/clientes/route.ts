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
    const { data: empresa, error: empresaError } = await supabase
      .from("empresas")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (empresaError || !empresa) {
      return NextResponse.json(
        {
          success: false,
          error: "Empresa no encontrada",
          errors: ["No se encontró la empresa asociada al usuario"],
        },
        { status: 404 },
      )
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const tipo = searchParams.get("tipo") || "todos"
    const estado = searchParams.get("estado") || "todos"
    const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(100, Math.max(1, Number.parseInt(searchParams.get("limit") || "50")))
    const offset = (page - 1) * limit

    let query = supabase
      .from("clientes")
      .select("*", { count: "exact" })
      .eq("empresa_id", empresa.id)
      .order("created_at", { ascending: false })

    // Aplicar filtros de búsqueda
    if (search) {
      query = query.or(
        `razon_social.ilike.%${search}%,rnc_cedula.ilike.%${search}%,email.ilike.%${search}%,nombre_comercial.ilike.%${search}%`,
      )
    }

    // Filtrar por tipo de cliente
    if (tipo !== "todos") {
      query = query.eq("tipo_cliente", tipo)
    }

    // Filtrar por estado
    if (estado !== "todos") {
      query = query.eq("activo", estado === "activo")
    }

    // Aplicar paginación
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          errors: ["Error al obtener clientes"],
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error("Error obteniendo clientes:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
        errors: ["Error inesperado al obtener clientes"],
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
    const { data: empresa, error: empresaError } = await supabase
      .from("empresas")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (empresaError || !empresa) {
      return NextResponse.json(
        {
          success: false,
          error: "Empresa no encontrada",
          errors: ["No se encontró la empresa asociada al usuario"],
        },
        { status: 404 },
      )
    }

    const body = await request.json()

    // Validar campos requeridos
    if (!body.tipo_cliente || !body.rnc_cedula || !body.razon_social) {
      return NextResponse.json(
        {
          success: false,
          error: "Campos requeridos faltantes",
          errors: ["Tipo de cliente, RNC/Cédula y razón social son requeridos"],
        },
        { status: 400 },
      )
    }

    // Validar tipo de cliente
    const tiposValidos = ["persona_fisica", "persona_juridica", "extranjero"]
    if (!tiposValidos.includes(body.tipo_cliente)) {
      return NextResponse.json(
        {
          success: false,
          error: "Tipo de cliente inválido",
          errors: ["El tipo de cliente debe ser persona_fisica, persona_juridica o extranjero"],
        },
        { status: 400 },
      )
    }

    // Preparar datos del cliente
    const clienteData = {
      empresa_id: empresa.id,
      tipo_cliente: body.tipo_cliente,
      rnc_cedula: body.rnc_cedula.trim(),
      razon_social: body.razon_social.trim(),
      nombre_comercial: body.nombre_comercial?.trim() || null,
      telefono: body.telefono?.trim() || null,
      email: body.email?.trim() || null,
      direccion: body.direccion?.trim() || null,
      provincia: body.provincia?.trim() || null,
      municipio: body.municipio?.trim() || null,
      pais: body.pais?.trim() || "DO",
      activo: body.activo !== false,
    }

    const { data, error } = await supabase.from("clientes").insert(clienteData).select().single()

    if (error) {
      // Manejar error de duplicado
      if (error.code === "23505") {
        return NextResponse.json(
          {
            success: false,
            error: "Cliente ya existe",
            errors: ["Ya existe un cliente con este RNC/Cédula"],
          },
          { status: 409 },
        )
      }

      return NextResponse.json(
        {
          success: false,
          error: error.message,
          errors: ["Error al crear cliente"],
        },
        { status: 500 },
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: "Cliente creado exitosamente",
        data,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creando cliente:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
        errors: ["Error inesperado al crear cliente"],
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse<ApiResponse>> {
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

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "ID requerido",
          errors: ["El ID del cliente es requerido"],
        },
        { status: 400 },
      )
    }

    // Limpiar datos de actualización
    const cleanUpdateData = Object.fromEntries(Object.entries(updateData).filter(([_, value]) => value !== undefined))

    const { data, error } = await supabase.from("clientes").update(cleanUpdateData).eq("id", id).select().single()

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          errors: ["Error al actualizar cliente"],
        },
        { status: 500 },
      )
    }

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error: "Cliente no encontrado",
          errors: ["No se encontró el cliente especificado"],
        },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Cliente actualizado exitosamente",
      data,
    })
  } catch (error) {
    console.error("Error actualizando cliente:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
        errors: ["Error inesperado al actualizar cliente"],
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "ID requerido",
          errors: ["El ID del cliente es requerido"],
        },
        { status: 400 },
      )
    }

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

    const { error } = await supabase.from("clientes").delete().eq("id", id)

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          errors: ["Error al eliminar cliente"],
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Cliente eliminado exitosamente",
    })
  } catch (error) {
    console.error("Error eliminando cliente:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
        errors: ["Error inesperado al eliminar cliente"],
      },
      { status: 500 },
    )
  }
}
