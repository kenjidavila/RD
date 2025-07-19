import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    const { data: borrador, error } = await supabase
      .from("borradores_comprobantes")
      .select(`
        *,
        usuarios(nombre, email)
      `)
      .eq("id", params.id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!borrador) {
      return NextResponse.json({ error: "Borrador no encontrado" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        ...borrador,
        usuario_info: borrador.usuarios || { nombre: "Usuario desconocido" },
      },
    })
  } catch (error) {
    console.error("Error obteniendo borrador:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
