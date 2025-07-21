import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { data: usuario, error: usuarioError } = await supabase
      .from("usuarios")
      .select("empresa_id")
      .eq("auth_user_id", user.id)
      .single()

    if (usuarioError || !usuario) {
      return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 })
    }

    const empresaId = usuario.empresa_id

    const { data: secuencias, error } = await supabase
      .from("configuracion_secuencias_ncf")
      .select("*")
      .eq("empresa_id", empresaId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching secuencias:", error)
      return NextResponse.json({ error: "Error cargando secuencias" }, { status: 500 })
    }

    return NextResponse.json({ secuencias })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { data: usuario, error: usuarioError } = await supabase
      .from("usuarios")
      .select("empresa_id")
      .eq("auth_user_id", user.id)
      .single()

    if (usuarioError || !usuario) {
      return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 })
    }

    const empresaId = usuario.empresa_id

    const body = await request.json()
    const { secuencias } = body

    if (!Array.isArray(secuencias)) {
      return NextResponse.json({ error: "Formato de datos inválido" }, { status: 400 })
    }

    // Validar y procesar cada secuencia
    const secuenciasParaGuardar = secuencias.map((sec) => ({
      empresa_id: empresaId,
      tipo_comprobante: sec.tipo_comprobante,
      secuencia_inicial: sec.secuencia_inicial,
      secuencia_final: sec.secuencia_final,
      secuencia_actual: sec.secuencia_actual || sec.secuencia_inicial,
      fecha_vencimiento: sec.fecha_vencimiento,
      activa: sec.activa !== false,
      validado_dgii: sec.validacion_inicial?.valido || false,
      mensaje_validacion: sec.validacion_inicial?.mensaje || null,
    }))

    // Eliminar secuencias existentes para esta empresa
    await supabase.from("configuracion_secuencias_ncf").delete().eq("empresa_id", empresaId)

    // Insertar nuevas secuencias
    const { error: insertError } = await supabase.from("configuracion_secuencias_ncf").insert(secuenciasParaGuardar)

    if (insertError) {
      console.error("Error inserting secuencias:", insertError)
      return NextResponse.json({ error: "Error guardando secuencias" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Secuencias guardadas correctamente" })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
