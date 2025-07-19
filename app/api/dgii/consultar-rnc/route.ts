import { type NextRequest, NextResponse } from "next/server"
import { DGIIRNCService } from "@/lib/dgii-rnc-service"

export async function POST(request: NextRequest) {
  try {
    const { rnc, soapRequest } = await request.json()

    if (!rnc || !soapRequest) {
      return NextResponse.json({ success: false, error: "RNC y solicitud SOAP son requeridos" }, { status: 400 })
    }

    // Realizar consulta SOAP a DGII
    const response = await fetch("https://dgii.gov.do/paginas/default.aspx", {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        SOAPAction: "http://dgii.gov.do/GetContribuyentes",
        "User-Agent": "Mozilla/5.0 (compatible; DGII-Client/1.0)",
      },
      body: soapRequest,
    })

    if (!response.ok) {
      throw new Error(`Error DGII: ${response.status} ${response.statusText}`)
    }

    const soapResponse = await response.text()

    // Parsear respuesta
    const contribuyenteInfo = DGIIRNCService.parseSOAPResponse(soapResponse)

    if (!contribuyenteInfo) {
      return NextResponse.json({
        success: false,
        error: "RNC no encontrado en DGII",
      })
    }

    return NextResponse.json({
      success: true,
      data: contribuyenteInfo,
    })
  } catch (error) {
    console.error("Error en consulta RNC DGII:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}
