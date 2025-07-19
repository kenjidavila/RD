import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    const { data: comprobantes, error } = await supabase
      .from("comprobantes_fiscales")
      .select(`
        *,
        clientes(razon_social, nombre_comercial, rnc_cedula)
      `)
      .order("created_at", { ascending: false })
      .limit(5)

    if (error) {
      throw new Error(error.message)
    }

    // Formatear los datos para el frontend
    const comprobantesFormateados =
      comprobantes?.map((comprobante) => {
        const clienteInfo = comprobante.clientes || {
          razon_social: comprobante.razon_social_comprador,
          rnc_cedula: comprobante.rnc_comprador,
        }

        return {
          id: comprobante.id,
          eNCF: comprobante.e_ncf,
          cliente: {
            nombre: clienteInfo.razon_social || clienteInfo.nombre_comercial || "Cliente sin nombre",
            rnc: clienteInfo.rnc_cedula || comprobante.rnc_comprador || "N/A",
            avatar: (clienteInfo.razon_social || clienteInfo.nombre_comercial || "C")
              .split(" ")
              .map((word) => word[0])
              .join("")
              .substring(0, 2)
              .toUpperCase(),
          },
          monto: comprobante.monto_total || 0,
          montoFormateado: new Intl.NumberFormat("es-DO", {
            style: "currency",
            currency: "DOP",
          }).format(comprobante.monto_total || 0),
          estado: comprobante.estado_dgii || "en_proceso",
          fecha: new Date(comprobante.created_at).toLocaleDateString("es-DO"),
          tipoComprobante: comprobante.tipo_comprobante,
        }
      }) || []

    return NextResponse.json({ success: true, data: comprobantesFormateados })
  } catch (error) {
    console.error("Error obteniendo comprobantes recientes:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
