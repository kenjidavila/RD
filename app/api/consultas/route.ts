import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tipoConsulta = searchParams.get("tipo_consulta") || "emitido"
  const tipoComprobante = searchParams.get("tipo_comprobante") || ""
  const eNCF = searchParams.get("e_ncf") || ""
  const fechaDesde = searchParams.get("fecha_desde") || ""
  const fechaHasta = searchParams.get("fecha_hasta") || ""
  const estadoDGII = searchParams.get("estado_dgii") || "todos"
  const rncComprador = searchParams.get("rnc_comprador") || ""
  const limite = Number.parseInt(searchParams.get("limite") || "50")

  const supabase = createRouteHandlerClient({ cookies })

  try {
    let query = supabase
      .from("comprobantes_fiscales")
      .select(`
        *,
        clientes(razon_social, nombre_comercial, rnc_cedula),
        detalles_comprobantes(*)
      `)
      .order("created_at", { ascending: false })

    // Filtrar por tipo de comprobante
    if (tipoComprobante && tipoComprobante !== "todos") {
      query = query.eq("tipo_comprobante", tipoComprobante)
    }

    // Filtrar por e-NCF específico
    if (eNCF) {
      query = query.ilike("e_ncf", `%${eNCF}%`)
    }

    // Filtrar por rango de fechas
    if (fechaDesde) {
      query = query.gte("fecha_emision", fechaDesde)
    }
    if (fechaHasta) {
      query = query.lte("fecha_emision", fechaHasta)
    }

    // Filtrar por estado DGII
    if (estadoDGII && estadoDGII !== "todos") {
      query = query.eq("estado_dgii", estadoDGII)
    }

    // Filtrar por RNC comprador/emisor
    if (rncComprador) {
      query = query.ilike("rnc_comprador", `%${rncComprador}%`)
    }

    query = query.limit(limite)

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Formatear los datos para el frontend
    const comprobantesFormateados =
      data?.map((comprobante) => ({
        id: comprobante.id,
        eNCF: comprobante.e_ncf,
        rncComprador: comprobante.rnc_comprador || "N/A",
        razonSocial:
          comprobante.razon_social_comprador ||
          comprobante.clientes?.razon_social ||
          comprobante.clientes?.nombre_comercial ||
          "N/A",
        fechaEmision: new Date(comprobante.fecha_emision).toLocaleDateString("es-DO"),
        montoTotal: comprobante.monto_total || 0,
        totalItbis: comprobante.subtotal_itbis || 0,
        estadoDGII: comprobante.estado_dgii || "en_proceso",
        tipoComprobante: comprobante.tipo_comprobante,
        totalItems: comprobante.detalles_comprobantes?.length || 0,
        created_at: comprobante.created_at,
      })) || []

    return NextResponse.json({
      success: true,
      data: comprobantesFormateados,
      total: comprobantesFormateados.length,
    })
  } catch (error) {
    console.error("Error en consulta de comprobantes:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
