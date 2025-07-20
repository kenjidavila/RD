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

    // Verificar código duplicado
    const { data: existing } = await supabase
      .from("items")
      .select("id")
      .eq("empresa_id", empresaId)
      .eq("codigo", codigo)
      .single()
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Código de item ya existe" },
        { status: 409 },
      )
    }

    // Preparar datos del item
    const itemData = {
      empresa_id: empresaId,
      codigo,
      codigo_barras: body.codigo_barras?.trim() || null,
      descripcion: body.descripcion.trim(),
      descripcion_corta: body.descripcion_corta?.trim() || null,
      tipo_item: body.tipo_item || "bien",
      categoria: body.categoria?.trim() || null,
      subcategoria: body.subcategoria?.trim() || null,
      marca: body.marca?.trim() || null,
      modelo: body.modelo?.trim() || null,
      unidad_medida: body.unidad_medida || "UND",
      peso: body.peso !== undefined ? Number.parseFloat(body.peso) : null,
      volumen: body.volumen !== undefined ? Number.parseFloat(body.volumen) : null,
      precio_compra: body.precio_compra !== undefined ? Number.parseFloat(body.precio_compra) : 0,
      precio_venta: body.precio_venta !== undefined ? Number.parseFloat(body.precio_venta) : 0,
      precio_venta_2: body.precio_venta_2 !== undefined ? Number.parseFloat(body.precio_venta_2) : null,
      precio_venta_3: body.precio_venta_3 !== undefined ? Number.parseFloat(body.precio_venta_3) : null,
      precio_minimo: body.precio_minimo !== undefined ? Number.parseFloat(body.precio_minimo) : null,
      tasa_itbis: body.tasa_itbis || "18",
      exento_itbis: body.exento_itbis === true,
      codigo_impuesto_adicional: body.codigo_impuesto_adicional?.trim() || null,
      tasa_impuesto_adicional:
        body.tasa_impuesto_adicional !== undefined ? Number.parseFloat(body.tasa_impuesto_adicional) : 0,
      aplica_isc: body.aplica_isc === true,
      grados_alcohol: body.grados_alcohol !== undefined ? Number.parseFloat(body.grados_alcohol) : null,
      cantidad_referencia:
        body.cantidad_referencia !== undefined ? Number.parseFloat(body.cantidad_referencia) : null,
      subcantidad: body.subcantidad !== undefined ? Number.parseFloat(body.subcantidad) : null,
      precio_unitario_referencia:
        body.precio_unitario_referencia !== undefined
          ? Number.parseFloat(body.precio_unitario_referencia)
          : null,
      maneja_inventario: body.maneja_inventario === true,
      stock_actual: body.stock_actual !== undefined ? Number.parseFloat(body.stock_actual) : 0,
      stock_minimo: body.stock_minimo !== undefined ? Number.parseFloat(body.stock_minimo) : 0,
      stock_maximo: body.stock_maximo !== undefined ? Number.parseFloat(body.stock_maximo) : 0,
      activo: body.activo !== false,
      es_favorito: body.es_favorito === true,
      notas: body.notas?.trim() || null,
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

    // Limpiar datos de actualización y convertir valores numéricos
    const cleanUpdateData: Record<string, any> = {}
    for (const [key, value] of Object.entries(updateData)) {
      if (value === undefined) continue
      switch (key) {
        case "peso":
        case "volumen":
        case "precio_compra":
        case "precio_venta":
        case "precio_venta_2":
        case "precio_venta_3":
        case "precio_minimo":
        case "tasa_impuesto_adicional":
        case "grados_alcohol":
        case "cantidad_referencia":
        case "subcantidad":
        case "precio_unitario_referencia":
        case "stock_actual":
        case "stock_minimo":
        case "stock_maximo":
          cleanUpdateData[key] = Number.parseFloat(value as any)
          break
        default:
          cleanUpdateData[key] = value
      }
    }

    const { data, error } = await supabase
      .from("items")
      .update(cleanUpdateData)
      .eq("id", id)
      .eq("empresa_id", empresaId)
      .select()
      .single()

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
      .from("items")
      .delete()
      .eq("id", id)
      .eq("empresa_id", empresaId)

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
