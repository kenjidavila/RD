import { type NextRequest, NextResponse } from "next/server"
import { DGIINCFService } from "@/lib/dgii-ncf-service"

export async function POST(request: NextRequest) {
  try {
    const { rnc, ncf, soapRequest } = await request.json()

    if (!rnc || !ncf || !soapRequest) {
      return NextResponse.json({ success: false, error: "RNC, NCF y solicitud SOAP son requeridos" }, { status: 400 })
    }

    // Realizar consulta SOAP a DGII
    const response = await fetch("https://dgii.gov.do/paginas/default.aspx", {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        SOAPAction: "http://dgii.gov.do/GetNCF",
        "User-Agent": "Mozilla/5.0 (compatible; DGII-Client/1.0)",
      },
      body: soapRequest,
    })

    if (!response.ok) {
      throw new Error(`Error DGII: ${response.status} ${response.statusText}`)
    }

    const soapResponse = await response.text()

    // Parsear respuesta
    const ncfInfo = DGIINCFService.parseSOAPResponse(soapResponse)

    if (!ncfInfo) {
      return NextResponse.json({
        success: false,
        error: "NCF no encontrado en DGII",
      })
    }

    return NextResponse.json({
      success: true,
      data: ncfInfo,
    })
  } catch (error) {
    console.error("Error en consulta NCF DGII:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}
