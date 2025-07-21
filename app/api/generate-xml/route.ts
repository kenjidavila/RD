import { type NextRequest, NextResponse } from "next/server"
import { XMLGenerator } from "@/lib/xml-generator"
import { ECFDataMapper } from "@/lib/ecf-data-mapper"
import { SupabaseServerUtils } from "@/lib/supabase-server-utils"
import type { ECFData } from "@/types/ecf-types"

export async function POST(request: NextRequest) {
  try {
    const body: { ecfData: ECFData; filename?: string } = await request.json()
    const { ecfData, filename } = body

    if (!ecfData || typeof ecfData !== "object") {
      return NextResponse.json({ error: "ECF data is required" }, { status: 400 })
    }

    const validation = ECFDataMapper.validateECFData(ecfData)
    if (!validation.isValid) {
      return NextResponse.json(
        { error: "Invalid ECF data", details: validation.errors },
        { status: 400 },
      )
    }

    // Ensure authenticated user and empresa exist
    const { empresa } = await SupabaseServerUtils.getSessionAndEmpresa()

    const generator = new XMLGenerator()
    const xmlString = generator.generateECFXML({ ...ecfData, rncEmisor: empresa.rnc })

    const fileName = `${filename || ecfData.eNCF || "comprobante"}.xml`

    return new NextResponse(xmlString, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
        "Content-Disposition": `attachment; filename=\"${fileName}\"`,
      },
    })
  } catch (error) {
    console.error("Error generating XML:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status: "healthy" })
}
