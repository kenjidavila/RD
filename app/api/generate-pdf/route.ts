import { type NextRequest, NextResponse } from "next/server"
import { PDFGenerator } from "@/lib/pdf-generator"
import type { ECFData } from "@/lib/xml-generator"

interface EmpresaData {
  razonSocial: string
  rnc: string
  [key: string]: any
}

interface RequestBody {
  ecfData: ECFData
  empresaData: EmpresaData
  filename?: string
  isPreview?: boolean
}

interface ECFGenerationError extends Error {
  code?: string
  statusCode?: number
}

// Helper function to validate RNC format (Dominican Republic tax ID)
const validateRNC = (rnc: string): boolean => {
  // Basic RNC validation - adjust pattern as needed
  const rncPattern = /^\d{9}|\d{11}$/
  return rncPattern.test(rnc.replace(/[-\s]/g, ''))
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json()
    const { ecfData, empresaData, filename, isPreview = false } = body

    // Validate ECF data
    if (!ecfData || typeof ecfData !== 'object') {
      return NextResponse.json(
        { error: "ECF data is required and must be a valid object" }, 
        { status: 400 }
      )
    }

    // Validate empresa data
    if (!empresaData || typeof empresaData !== 'object') {
      return NextResponse.json(
        { error: "Company data is required and must be a valid object" }, 
        { status: 400 }
      )
    }

    // Validate required empresa fields
    if (!empresaData.razonSocial?.trim()) {
      return NextResponse.json(
        { error: "Company name (razonSocial) is required" },
        { status: 400 }
      )
    }

    if (!empresaData.rnc?.trim()) {
      return NextResponse.json(
        { error: "Company RNC is required" },
        { status: 400 }
      )
    }

    // Validate RNC format
    if (!validateRNC(empresaData.rnc)) {
      return NextResponse.json(
        { error: "Invalid RNC format" },
        { status: 400 }
      )
    }

    // Validate required ECF fields
    const requiredFields: (keyof ECFData)[] = ['eNCF', 'fechaEmision']
    const missingFields = requiredFields.filter(field => !ecfData[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: "Missing required ECF fields", missingFields }, 
        { status: 400 }
      )
    }

    // Validate eNCF format (adjust pattern as needed)
    const encfPattern = /^[A-Z]\d{10}$/
    if (!encfPattern.test(ecfData.eNCF)) {
      return NextResponse.json(
        { error: "Invalid eNCF format" },
        { status: 400 }
      )
    }

    // Create PDF generator instance
    const pdfGenerator = new PDFGenerator()

    // Load personalization config with timeout
    try {
      await Promise.race([
        pdfGenerator.loadPersonalizacionConfig(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Config load timeout')), 10000)
        )
      ])
    } catch (configError) {
      console.error("Error loading personalization config:", configError)
      return NextResponse.json(
        { error: "Failed to load PDF configuration" }, 
        { status: 500 }
      )
    }

    // Prepare ECF data for PDF generation
    const finalEcfData: ECFData = isPreview
      ? { 
          ...ecfData, 
          codigoSeguridad: "PREVIEW", 
          fechaFirma: new Date().toISOString() 
        }
      : ecfData

    // Generate PDF with timeout protection
    let pdfBuffer: Uint8Array
    try {
      pdfBuffer = await Promise.race([
        Promise.resolve(pdfGenerator.generateECFPDF(finalEcfData, empresaData)),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('PDF generation timeout')), 30000)
        )
      ])
    } catch (pdfError) {
      console.error("PDF generation failed:", pdfError)
      const error = pdfError as ECFGenerationError
      
      return NextResponse.json(
        {
          error: "Failed to generate PDF",
          details: error.message,
          code: error.code || "PDF_GENERATION_ERROR"
        },
        { status: error.statusCode || 500 }
      )
    }

    // Validate PDF buffer
    if (!pdfBuffer || pdfBuffer.length === 0) {
      return NextResponse.json(
        { error: "Generated PDF is empty or invalid" }, 
        { status: 500 }
      )
    }

    // Enhanced filename sanitization
    const sanitizeFilename = (name: string): string => {
      return name
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/_{2,}/g, '_')  // Replace multiple underscores with single
        .replace(/^_|_$/g, '')   // Remove leading/trailing underscores
        .substring(0, 200)       // Limit length
    }

    const finalFilename = filename
      ? sanitizeFilename(filename)
      : sanitizeFilename(`${isPreview ? "Vista_Previa_" : "e-CF_"}${finalEcfData.eNCF}.pdf`)

    // Ensure filename has .pdf extension
    const filenameWithExtension = finalFilename.endsWith('.pdf') 
      ? finalFilename 
      : `${finalFilename}.pdf`

    // Return PDF response with comprehensive headers
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filenameWithExtension}"`,
        "Content-Length": pdfBuffer.length.toString(),
        "Cache-Control": isPreview 
          ? "no-cache, no-store, must-revalidate" 
          : "public, max-age=3600",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-Download-Options": "noopen",
        "Pragma": isPreview ? "no-cache" : "public"
      },
    })

  } catch (error) {
    console.error("Unexpected error in PDF generation:", error)
    
    // Handle specific error types
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" }, 
        { status: 400 }
      )
    }

    // Handle payload too large
    if (error instanceof Error && error.message.includes('PayloadTooLargeError')) {
      return NextResponse.json(
        { error: "Request payload too large" },
        { status: 413 }
      )
    }

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    
    return NextResponse.json(
      {
        error: "Internal server error",
        details: process.env.NODE_ENV === 'development' ? errorMessage : 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID() // For tracking purposes
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    service: "PDF Generation API",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  })
}
