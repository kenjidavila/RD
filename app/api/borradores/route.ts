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
    const tipoComprobante = searchParams.get("tipo_comprobante") || ""
    const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(100, Math.max(1, Number.parseInt(searchParams.get("limit") || "10")))
    const offset = (page - 1) * limit

    let query = supabase
      .from("borradores_comprobantes")
      .select("*", { count: "exact" })
      .eq("empresa_id", empresa.id)
      .order("updated_at", { ascending: false })

    // Aplicar filtros de búsqueda
    if (search) {
      query = query.or(`nombre_borrador.ilike.%${search}%,descripcion.ilike.%${search}%`)
    }

    // Filtrar por tipo de comprobante
    if (tipoComprobante && tipoComprobante !== "todos") {
      query = query.eq("tipo_comprobante", tipoComprobante)
    }

    // Aplicar paginación
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          errors: ["Error al obtener borradores"],
        },
        { status: 500 },
      )
    }

    // Formatear los datos para el frontend
    const borradoresFormateados =
      data?.map((borrador) => ({
        ...borrador,
        monto_formateado: new Intl.NumberFormat("es-DO", {
          style: "currency",
          currency: "DOP",
        }).format(borrador.monto_total || 0),
        fecha_formateada: new Date(borrador.updated_at).toLocaleDateString("es-DO"),
        tipo_comprobante_nombre: getTipoComprobanteNombre(borrador.tipo_comprobante),
      })) || []

    return NextResponse.json({
      success: true,
      data: borradoresFormateados,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error("Error obteniendo borradores:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
        errors: ["Error inesperado al obtener borradores"],
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
    const { nombre_borrador, descripcion, datos_comprobante, tipo_comprobante, monto_total, cantidad_items } = body

    // Validar datos requeridos
    if (!nombre_borrador || !datos_comprobante || !tipo_comprobante) {
      return NextResponse.json(
        {
          success: false,
          error: "Datos requeridos faltantes",
          errors: ["Nombre del borrador, datos del comprobante y tipo son requeridos"],
        },
        { status: 400 },
      )
    }

    // Validar tipo de comprobante
    const tiposSoportados = ["31", "32", "33", "34", "41", "43", "44", "45", "46", "47"]
    if (!tiposSoportados.includes(tipo_comprobante)) {
      return NextResponse.json(
        {
          success: false,
          error: "Tipo de comprobante inválido",
          errors: ["El tipo de comprobante especificado no es válido"],
        },
        { status: 400 },
      )
    }

    // Preparar datos del borrador
    const borradorData = {
      empresa_id: empresa.id,
      nombre_borrador: nombre_borrador.trim(),
      descripcion: descripcion?.trim() || null,
      tipo_comprobante,
      datos_comprobante,
      monto_total: Number.parseFloat(monto_total) || 0,
      cantidad_items: Number.parseInt(cantidad_items) || 0,
    }

    const { data: borrador, error: errorBorrador } = await supabase
      .from("borradores_comprobantes")
      .insert(borradorData)
      .select()
      .single()

    if (errorBorrador) {
      return NextResponse.json(
        {
          success: false,
          error: errorBorrador.message,
          errors: ["Error al guardar borrador"],
        },
        { status: 500 },
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: "Borrador guardado exitosamente",
        data: borrador,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error guardando borrador:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
        errors: ["Error inesperado al guardar borrador"],
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
          errors: ["El ID del borrador es requerido"],
        },
        { status: 400 },
      )
    }

    // Limpiar datos de actualización
    const cleanUpdateData = Object.fromEntries(Object.entries(updateData).filter(([_, value]) => value !== undefined))

    // Agregar timestamp de actualización
    cleanUpdateData.updated_at = new Date().toISOString()

    const { data: borrador, error: errorUpdate } = await supabase
      .from("borradores_comprobantes")
      .update(cleanUpdateData)
      .eq("id", id)
      .select()
      .single()

    if (errorUpdate) {
      return NextResponse.json(
        {
          success: false,
          error: errorUpdate.message,
          errors: ["Error al actualizar borrador"],
        },
        { status: 500 },
      )
    }

    if (!borrador) {
      return NextResponse.json(
        {
          success: false,
          error: "Borrador no encontrado",
          errors: ["No se encontró el borrador especificado"],
        },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Borrador actualizado exitosamente",
      data: borrador,
    })
  } catch (error) {
    console.error("Error actualizando borrador:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
        errors: ["Error inesperado al actualizar borrador"],
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
          errors: ["El ID del borrador es requerido"],
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

    const { error } = await supabase.from("borradores_comprobantes").delete().eq("id", id)

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          errors: ["Error al eliminar borrador"],
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Borrador eliminado exitosamente",
    })
  } catch (error) {
    console.error("Error eliminando borrador:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
        errors: ["Error inesperado al eliminar borrador"],
      },
      { status: 500 },
    )
  }
}

function getTipoComprobanteNombre(tipo: string): string {
  const tipos: Record<string, string> = {
    "31": "Factura de Crédito Fiscal",
    "32": "Factura de Consumo",
    "33": "Nota de Débito",
    "34": "Nota de Crédito",
    "41": "Compras",
    "43": "Gastos Menores",
    "44": "Regímenes Especiales",
    "45": "Gubernamental",
    "46": "Exportaciones",
    "47": "Pagos al Exterior",
  }
  return tipos[tipo] || `Tipo ${tipo}`
}
