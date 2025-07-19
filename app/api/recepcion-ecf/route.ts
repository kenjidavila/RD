import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const xmlFile = formData.get("xml") as File
    const emisorRNC = formData.get("emisorRNC") as string

    if (!xmlFile || !emisorRNC) {
      return NextResponse.json({ success: false, error: "XML file y RNC emisor son requeridos" }, { status: 400 })
    }

    // Leer contenido del XML
    const xmlContent = await xmlFile.text()

    // Parsear XML para extraer información
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xmlContent, "text/xml")

    // Extraer datos del e-CF
    const eNCF = xmlDoc.querySelector("eNCF")?.textContent || ""
    const fechaEmision = xmlDoc.querySelector("FechaEmision")?.textContent || ""
    const montoTotal = Number.parseFloat(xmlDoc.querySelector("MontoTotal")?.textContent || "0")
    const rncComprador = xmlDoc.querySelector("RNCComprador")?.textContent || ""

    // Generar ID único para tracking
    const trackId = `REC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Guardar en base de datos
    const supabase = createClient()

    const { error: insertError } = await supabase.from("comprobantes_recibidos").insert({
      track_id: trackId,
      encf: eNCF,
      emisor_rnc: emisorRNC,
      receptor_rnc: rncComprador,
      fecha_emision: fechaEmision,
      monto_total: montoTotal,
      xml_content: xmlContent,
      estado: "recibido",
      fecha_recepcion: new Date().toISOString(),
    })

    if (insertError) {
      console.error("Error guardando comprobante:", insertError)
      return NextResponse.json({ success: false, error: "Error guardando comprobante" }, { status: 500 })
    }

    // Generar acuse de recibo
    const acuseRecibo = generarAcuseRecibo(trackId, eNCF, emisorRNC)

    return NextResponse.json({
      success: true,
      message: "e-CF recibido correctamente",
      trackId,
      acuseRecibo: Buffer.from(acuseRecibo).toString("base64"),
      eNCF,
    })
  } catch (error) {
    console.error("Error procesando e-CF:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const encf = searchParams.get("encf")
    const trackId = searchParams.get("trackId")

    const supabase = createClient()

    let query = supabase.from("comprobantes_recibidos").select("*").order("fecha_recepcion", { ascending: false })

    if (encf) {
      query = query.eq("encf", encf)
    }

    if (trackId) {
      query = query.eq("track_id", trackId)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ success: false, error: "Error consultando comprobantes" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      comprobantes: data,
    })
  } catch (error) {
    console.error("Error consultando comprobantes:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}

function generarAcuseRecibo(trackId: string, eNCF: string, emisorRNC: string): string {
  const fechaActual = new Date().toISOString()

  return `<?xml version="1.0" encoding="UTF-8"?>
<AcuseRecibo xmlns="http://dgii.gov.do/ecf/acuse" version="1.0">
  <TrackId>${trackId}</TrackId>
  <eNCF>${eNCF}</eNCF>
  <EmisorRNC>${emisorRNC}</EmisorRNC>
  <FechaRecepcion>${fechaActual}</FechaRecepcion>
  <Estado>RECIBIDO</Estado>
  <Mensaje>Comprobante fiscal electrónico recibido correctamente</Mensaje>
  <CodigoRespuesta>200</CodigoRespuesta>
</AcuseRecibo>`
}
