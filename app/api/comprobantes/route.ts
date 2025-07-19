import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { v4 as uuidv4 } from "uuid"

interface ApiResponse {
  success: boolean
  message?: string
  data?: any
  error?: string
  errors?: string[]
}

// Función para generar un trackId único
function generateTrackId(tipo_comprobante: string): string {
  return `${tipo_comprobante}-${uuidv4()}`
}

// Función para generar un código de seguridad aleatorio
function generateSecurityCode(): string {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let securityCode = ""
  for (let i = 0; i < 12; i++) {
    securityCode += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return securityCode
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
      .select("id, rnc, razon_social")
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
    const { tipo_comprobante, datos_ecf } = body

    // Validar campos requeridos
    if (!tipo_comprobante || !datos_ecf) {
      return NextResponse.json(
        {
          success: false,
          error: "Datos requeridos faltantes",
          errors: ["Tipo de comprobante y datos del e-CF son requeridos"],
        },
        { status: 400 },
      )
    }

    // Validar que el tipo de e-CF sea soportado
    const tiposSoportados = ["31", "32", "33", "34", "41", "43", "44", "45", "46", "47"]
    if (!tiposSoportados.includes(tipo_comprobante)) {
      return NextResponse.json(
        {
          success: false,
          error: `Tipo de e-CF no soportado: ${tipo_comprobante}`,
          errors: ["El tipo de comprobante especificado no es válido"],
        },
        { status: 400 },
      )
    }

    // Validar monto total
    if (!datos_ecf.montoTotal || Number.parseFloat(datos_ecf.montoTotal) <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Monto total inválido",
          errors: ["El monto total debe ser mayor a cero"],
        },
        { status: 400 },
      )
    }

    // Generar e-NCF usando la función de la base de datos
    const { data: eNCF, error: encfError } = await supabase.rpc("generar_encf", {
      p_empresa_id: empresa.id,
      p_tipo_comprobante: tipo_comprobante,
    })

    if (encfError || !eNCF) {
      return NextResponse.json(
        {
          success: false,
          error: "Error generando e-NCF",
          errors: [encfError?.message || "No se pudo generar el e-NCF"],
        },
        { status: 500 },
      )
    }

    // Generar trackId único
    const trackId = generateTrackId(tipo_comprobante)

    // Generar código de seguridad
    const codigoSeguridad = generateSecurityCode()

    // Crear URL del QR
    const qrCodeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/validar/${trackId}`

    // Preparar datos del comprobante
    const comprobanteData = {
      empresa_id: empresa.id,
      e_ncf: eNCF,
      tipo_comprobante,
      fecha_emision: datos_ecf.fechaEmision || new Date().toISOString().split("T")[0],
      rnc_comprador: datos_ecf.rncComprador || null,
      razon_social_comprador: datos_ecf.razonSocialComprador || null,
      telefono_comprador: datos_ecf.telefonoComprador || null,
      email_comprador: datos_ecf.emailComprador || null,
      direccion_comprador: datos_ecf.direccionComprador || null,
      provincia_comprador: datos_ecf.provinciaComprador || null,
      municipio_comprador: datos_ecf.municipioComprador || null,
      pais_comprador: datos_ecf.paisComprador || "DO",
      monto_gravado_18: Number.parseFloat(datos_ecf.montoGravado18) || 0,
      monto_gravado_16: Number.parseFloat(datos_ecf.montoGravado16) || 0,
      monto_gravado_0: Number.parseFloat(datos_ecf.montoGravado0) || 0,
      itbis_18: Number.parseFloat(datos_ecf.itbis18) || 0,
      itbis_16: Number.parseFloat(datos_ecf.itbis16) || 0,
      itbis_0: Number.parseFloat(datos_ecf.itbis0) || 0,
      subtotal_gravado: Number.parseFloat(datos_ecf.subtotalGravado) || 0,
      subtotal_itbis: Number.parseFloat(datos_ecf.subtotalItbis) || 0,
      subtotal_exento: Number.parseFloat(datos_ecf.subtotalExento) || 0,
      total_itbis_retenido: Number.parseFloat(datos_ecf.totalItbisRetenido) || 0,
      total_isr_retenido: Number.parseFloat(datos_ecf.totalIsrRetenido) || 0,
      monto_total: Number.parseFloat(datos_ecf.montoTotal),
      estado_dgii: "emitido",
      codigo_seguridad: codigoSeguridad,
      track_id: trackId,
      fecha_firma: new Date().toISOString(),
      qr_code_url: qrCodeUrl,
    }

    // Guardar comprobante en base de datos
    const { data: comprobante, error: comprobanteError } = await supabase
      .from("comprobantes_fiscales")
      .insert(comprobanteData)
      .select()
      .single()

    if (comprobanteError) {
      return NextResponse.json(
        {
          success: false,
          error: "Error al guardar el comprobante",
          errors: [comprobanteError.message],
        },
        { status: 500 },
      )
    }

    // Guardar detalles del comprobante
    if (datos_ecf.detalles && Array.isArray(datos_ecf.detalles) && datos_ecf.detalles.length > 0) {
      const detallesData = datos_ecf.detalles.map((detalle: any, index: number) => ({
        comprobante_id: comprobante.id,
        numero_linea: index + 1,
        descripcion: detalle.descripcion || "",
        tipo_item: detalle.tipoItem || "bien",
        cantidad: Number.parseFloat(detalle.cantidad) || 1,
        precio_unitario: Number.parseFloat(detalle.precioUnitario) || 0,
        tasa_itbis: detalle.tasaItbis || "18",
        descuento: Number.parseFloat(detalle.descuento) || 0,
        itbis_retenido: Number.parseFloat(detalle.itbisRetenido) || 0,
        isr_retenido: Number.parseFloat(detalle.isrRetenido) || 0,
        valor_total: Number.parseFloat(detalle.valorTotal) || 0,
      }))

      const { error: detallesError } = await supabase.from("detalles_comprobantes").insert(detallesData)

      if (detallesError) {
        console.error("Error saving detalles:", detallesError)
        // No fallar completamente, pero registrar el error
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Comprobante fiscal creado exitosamente",
        data: {
          trackId,
          eNCF,
          codigoSeguridad,
          qrCodeUrl,
          comprobante,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creando comprobante:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
        errors: ["Error inesperado al crear comprobante"],
      },
      { status: 500 },
    )
  }
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
    const desde = searchParams.get("desde")
    const hasta = searchParams.get("hasta")
    const tipo = searchParams.get("tipo")
    const estado = searchParams.get("estado")
    const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(100, Math.max(1, Number.parseInt(searchParams.get("limit") || "50")))
    const offset = (page - 1) * limit

    let query = supabase
      .from("comprobantes_fiscales")
      .select(
        `
        *,
        detalles_comprobantes(*)
      `,
        { count: "exact" },
      )
      .eq("empresa_id", empresa.id)
      .order("created_at", { ascending: false })

    if (desde) {
      query = query.gte("fecha_emision", desde)
    }

    if (hasta) {
      query = query.lte("fecha_emision", hasta)
    }

    if (tipo) {
      query = query.eq("tipo_comprobante", tipo)
    }

    if (estado) {
      query = query.eq("estado_dgii", estado)
    }

    // Aplicar paginación
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          errors: ["Error al obtener comprobantes"],
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
    console.error("Error obteniendo comprobantes:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
        errors: ["Error inesperado al obtener comprobantes"],
      },
      { status: 500 },
    )
  }
}
