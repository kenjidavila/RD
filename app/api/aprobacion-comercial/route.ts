import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { SupabaseServerUtils } from "@/lib/supabase-server-utils"

interface AprobacionComercialRequest {
  eNCF: string
  emisorRNC: string
  tipoAprobacion: "aprobacion" | "rechazo"
  motivo: string
  fechaAprobacion: string
  observaciones?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: AprobacionComercialRequest = await request.json()

    const { eNCF, tipoAprobacion, motivo, fechaAprobacion, observaciones } = body

    if (!eNCF || !tipoAprobacion || !motivo) {
      return NextResponse.json({ success: false, error: "Datos requeridos faltantes" }, { status: 400 })
    }

    // Obtener usuario y empresa asociada
    const { user, empresa } = await SupabaseServerUtils.getSessionAndEmpresa()
    const emisorRNC = empresa.rnc

    const supabase = await createServerClient()

    // Verificar que el e-CF existe
    const { data: comprobante, error: consultaError } = await supabase
      .from("comprobantes_recibidos")
      .select("*")
      .eq("encf", eNCF)
      .eq("emisor_rnc", emisorRNC)
      .single()

    if (consultaError || !comprobante) {
      return NextResponse.json({ success: false, error: "e-CF no encontrado" }, { status: 404 })
    }

    // Generar ID único para tracking
    const trackId = `APR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Guardar aprobación comercial
    const { error: insertError } = await supabase.from("aprobaciones_comerciales").insert({
      track_id: trackId,
      encf: eNCF,
      emisor_rnc: emisorRNC,
      tipo_aprobacion: tipoAprobacion,
      motivo,
      fecha_aprobacion: fechaAprobacion,
      observaciones,
      estado: "procesado",
      fecha_procesamiento: new Date().toISOString(),
    })

    if (insertError) {
      console.error("Error guardando aprobación:", insertError)
      return NextResponse.json({ success: false, error: "Error guardando aprobación comercial" }, { status: 500 })
    }

    // Actualizar estado del comprobante original
    const nuevoEstado = tipoAprobacion === "aprobacion" ? "aprobado_comercialmente" : "rechazado_comercialmente"

    const { error: updateError } = await supabase
      .from("comprobantes_recibidos")
      .update({
        estado: nuevoEstado,
        fecha_aprobacion: fechaAprobacion,
        motivo_aprobacion: motivo,
        observaciones_aprobacion: observaciones,
      })
      .eq("encf", eNCF)
      .eq("emisor_rnc", emisorRNC)

    if (updateError) {
      console.error("Error actualizando comprobante:", updateError)
    }

    // Generar confirmación XML
    const confirmacion = generarConfirmacionAprobacion(trackId, eNCF, emisorRNC, tipoAprobacion, motivo)

    return NextResponse.json({
      success: true,
      message: "Aprobación comercial procesada correctamente",
      trackId,
      confirmacion: Buffer.from(confirmacion).toString("base64"),
      eNCF,
      nuevoEstado,
    })
  } catch (error) {
    console.error("Error procesando aprobación comercial:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const encf = searchParams.get("encf")
    const { empresa } = await SupabaseServerUtils.getSessionAndEmpresa()
    const emisorRNC = empresa.rnc

    const supabase = await createServerClient()

    let query = supabase.from("aprobaciones_comerciales").select("*").order("fecha_procesamiento", { ascending: false })

    if (encf) {
      query = query.eq("encf", encf)
    }

    query = query.eq("emisor_rnc", emisorRNC)

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ success: false, error: "Error consultando aprobaciones" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      aprobaciones: data,
    })
  } catch (error) {
    console.error("Error consultando aprobaciones:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}

function generarConfirmacionAprobacion(
  trackId: string,
  eNCF: string,
  emisorRNC: string,
  tipoAprobacion: string,
  motivo: string,
): string {
  const fechaActual = new Date().toISOString()

  return `<?xml version="1.0" encoding="UTF-8"?>
<ConfirmacionAprobacion xmlns="http://dgii.gov.do/ecf/aprobacion" version="1.0">
  <TrackId>${trackId}</TrackId>
  <eNCF>${eNCF}</eNCF>
  <EmisorRNC>${emisorRNC}</EmisorRNC>
  <TipoAprobacion>${tipoAprobacion.toUpperCase()}</TipoAprobacion>
  <Motivo>${motivo}</Motivo>
  <FechaProcesamiento>${fechaActual}</FechaProcesamiento>
  <Estado>PROCESADO</Estado>
  <Mensaje>Aprobación comercial procesada correctamente</Mensaje>
  <CodigoRespuesta>200</CodigoRespuesta>
</ConfirmacionAprobacion>`
}
