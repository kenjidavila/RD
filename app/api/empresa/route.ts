import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { SupabaseServerUtils } from "@/lib/supabase-server-utils"
import crypto from "crypto"

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

    const { data: existing } = await supabase
      .from("empresas")
      .select("id")
      .eq("user_id", user.id)
      .single()

    const upsertData: Record<string, any> = {
      ...body,
      user_id: user.id,
      owner_id: user.id,
      updated_at: new Date().toISOString(),
    }

    if (existing) {
      upsertData.id = existing.id
    } else {
      upsertData.id = crypto.randomUUID()
      upsertData.created_at = new Date().toISOString()
    }

    const { data: empresa, error } = await supabase
      .from("empresas")
      .upsert(upsertData, { onConflict: "user_id" })
      .select()
      .single()

    if (error) throw error

    await supabase
      .from("usuarios")
      .update({ empresa_id: empresa.id, updated_at: new Date().toISOString() })
      .or(`auth_user_id.eq.${user.id},id.eq.${user.id}`)

    return NextResponse.json({ success: true, data: empresa, message: "Empresa guardada" })
  } catch (error: any) {
    console.error("Error guardando empresa:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Error inesperado" },
      { status: 500 },
    )
  }
}
