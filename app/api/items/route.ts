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
      .eq("id", user.id)
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
    const search = searchParams.get("search") || ""
    const categoria = searchParams.get("categoria") || "todas"
    const tipo = searchParams.get("tipo") || "todos"
    const estado = searchParams.get("estado") || "todos"
    const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(100, Math.max(1, Number.parseInt(searchParams.get("limit") || "50")))
    const offset = (page - 1) * limit

    let query = supabase
      .from("items")
      .select("*", { count: "exact" })
      .eq("empresa_id", empresaId)
      .order("created_at", { ascending: false })

    // Aplicar filtros de búsqueda
    if (search) {
      query = query.or(`descripcion.ilike.%${search}%,codigo.ilike.%${search}%,descripcion_corta.ilike.%${search}%`)
    }

    // Filtrar por categoría
    if (categoria !== "todas") {
      query = query.eq("categoria", categoria)
    }

    // Filtrar por tipo
    if (tipo !== "todos") {
      query = query.eq("tipo_item", tipo)
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
          errors: ["Error al obtener items"],
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
    console.error("Error obteniendo items:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
        errors: ["Error inesperado al obtener items"],
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
      .eq("id", user.id)
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

    // Validar campos requeridos
    if (!body.descripcion) {
      return NextResponse.json(
        {
          success: false,
          error: "Descripción requerida",
          errors: ["La descripción del item es requerida"],
        },
        { status: 400 },
      )
    }

    // Validar tipo de item
    const tiposValidos = ["bien", "servicio"]
    if (body.tipo_item && !tiposValidos.includes(body.tipo_item)) {
      return NextResponse.json(
        {
          success: false,
          error: "Tipo de item inválido",
          errors: ["El tipo de item debe ser 'bien' o 'servicio'"],
        },
        { status: 400 },
      )
    }

    // Validar tasa ITBIS
    const tasasValidas = ["0", "16", "18"]
    if (body.tasa_itbis && !tasasValidas.includes(body.tasa_itbis)) {
      return NextResponse.json(
        {
          success: false,
          error: "Tasa ITBIS inválida",
          errors: ["La tasa ITBIS debe ser 0, 16 o 18"],
        },
        { status: 400 },
      )
    }

    // Generar código automático si no se proporciona
    let codigo = body.codigo?.trim()
    if (!codigo) {
      const { data: codigoResult, error: codigoError } = await supabase.rpc("generar_codigo_item", {
        p_empresa_id: empresaId,
        p_tipo_item: body.tipo_item || "bien",
      })

      if (codigoError) {
        return NextResponse.json(
          {
            success: false,
            error: "Error generando código automático",
            errors: [codigoError.message],
          },
          { status: 500 },
        )
      }

      codigo = codigoResult
    }

    // Preparar datos del item
    const itemData = {
      empresa_id: empresaId,
      codigo,
      descripcion: body.descripcion.trim(),
      descripcion_corta: body.descripcion_corta?.trim() || null,
      tipo_item: body.tipo_item || "bien",
      categoria: body.categoria?.trim() || null,
      precio_unitario: Number.parseFloat(body.precio_unitario) || 0,
      tasa_itbis: body.tasa_itbis || "18",
      activo: body.activo !== false,
    }

    const { data, error } = await supabase.from("items").insert(itemData).select().single()

    if (error) {
      // Manejar error de duplicado
      if (error.code === "23505") {
        return NextResponse.json(
          {
            success: false,
            error: "Código de item ya existe",
            errors: ["Ya existe un item con este código"],
          },
          { status: 409 },
        )
      }

      return NextResponse.json(
        {
          success: false,
          error: error.message,
          errors: ["Error al crear item"],
        },
        { status: 500 },
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: "Item creado exitosamente",
        data,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creando item:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
        errors: ["Error inesperado al crear item"],
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
          errors: ["El ID del item es requerido"],
        },
        { status: 400 },
      )
    }

    // Validar tasa ITBIS si se proporciona
    if (updateData.tasa_itbis) {
      const tasasValidas = ["0", "16", "18"]
      if (!tasasValidas.includes(updateData.tasa_itbis)) {
        return NextResponse.json(
          {
            success: false,
            error: "Tasa ITBIS inválida",
            errors: ["La tasa ITBIS debe ser 0, 16 o 18"],
          },
          { status: 400 },
        )
      }
    }

    // Validar tipo de item si se proporciona
    if (updateData.tipo_item) {
      const tiposValidos = ["bien", "servicio"]
      if (!tiposValidos.includes(updateData.tipo_item)) {
        return NextResponse.json(
          {
            success: false,
            error: "Tipo de item inválido",
            errors: ["El tipo de item debe ser 'bien' o 'servicio'"],
          },
          { status: 400 },
        )
      }
    }

    // Limpiar datos de actualización
    const cleanUpdateData = Object.fromEntries(Object.entries(updateData).filter(([_, value]) => value !== undefined))

    // Convertir precio_unitario a número si existe
    if (cleanUpdateData.precio_unitario) {
      cleanUpdateData.precio_unitario = Number.parseFloat(cleanUpdateData.precio_unitario)
    }

    const { data, error } = await supabase.from("items").update(cleanUpdateData).eq("id", id).select().single()

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          errors: ["Error al actualizar item"],
        },
        { status: 500 },
      )
    }

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error: "Item no encontrado",
          errors: ["No se encontró el item especificado"],
        },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Item actualizado exitosamente",
      data,
    })
  } catch (error) {
    console.error("Error actualizando item:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
        errors: ["Error inesperado al actualizar item"],
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
          errors: ["El ID del item es requerido"],
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

    const { error } = await supabase.from("items").delete().eq("id", id)

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          errors: ["Error al eliminar item"],
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Item eliminado exitosamente",
    })
  } catch (error) {
    console.error("Error eliminando item:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
        errors: ["Error inesperado al eliminar item"],
      },
      { status: 500 },
    )
  }
}
