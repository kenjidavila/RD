import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { SupabaseServerUtils } from "@/lib/supabase-server-utils"

export const dynamic = "force-dynamic"

interface ApiResponse {
  success: boolean
  message?: string
  data?: any
  error?: string
}

export async function GET(): Promise<NextResponse<ApiResponse>> {
  try {
    const { empresa } = await SupabaseServerUtils.getSessionAndEmpresa()
    return NextResponse.json({ success: true, data: empresa })
  } catch (error: any) {
    const message = error.message || "Error inesperado"
    const status = message === "Usuario no autenticado" ? 401 : 404
    return NextResponse.json({ success: false, error: message }, { status })
  }
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ApiResponse>> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 },
      )
    }

    const body = await request.json()

    let currentEmpresa
    try {
      ;({ empresa: currentEmpresa } = await SupabaseServerUtils.getSessionAndEmpresa())
    } catch (err: any) {
      if (err.message === "Empresa no encontrada") {
        currentEmpresa = null
      } else {
        throw err
      }
    }

    let empresa
    let error
    if (currentEmpresa) {
      ;({ data: empresa, error } = await supabase
        .from("empresas")
        .update({
          ...body,
          owner_id: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentEmpresa.id)
        .select()
        .single())
    } else {
      ;({ data: empresa, error } = await supabase
        .from("empresas")
        .insert({ ...body, owner_id: user.id })
        .select()
        .single())
    }

    if (error) throw error

    const { error: userUpdateError } = await supabase
      .from("usuarios")
      .update({ empresa_id: empresa.id, updated_at: new Date().toISOString() })
      .eq("auth_user_id", user.id)

    if (userUpdateError) {
      console.error("Error vinculando empresa al usuario:", userUpdateError)
      return NextResponse.json(
        { success: false, error: "Error actualizando usuario" },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true, data: empresa, message: "Empresa guardada" })
  } catch (error: any) {
    console.error("Error guardando empresa:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Error inesperado" },
      { status: 500 },
    )
  }
}
