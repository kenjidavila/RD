import { createClient } from "@/lib/supabase"

export interface Notification {
  id?: string
  usuario_id: string
  tipo: string
  titulo: string
  mensaje: string
  leida?: boolean
  datos_adicionales?: any
  fecha_envio?: string
  fecha_lectura?: string
}

export class NotificationService {
  private static supabase = createClient()

  static async enviarNotificacion(notification: Omit<Notification, "id" | "fecha_envio">): Promise<boolean> {
    try {
      const { error } = await this.supabase.from("notificaciones").insert({
        ...notification,
        fecha_envio: new Date().toISOString(),
      })

      return !error
    } catch (error) {
      console.error("Error enviando notificación:", error)
      return false
    }
  }

  static async obtenerNotificaciones(usuarioId: string, limite = 50): Promise<Notification[]> {
    try {
      const { data, error } = await this.supabase
        .from("notificaciones")
        .select("*")
        .eq("usuario_id", usuarioId)
        .order("fecha_envio", { ascending: false })
        .limit(limite)

      return data || []
    } catch (error) {
      console.error("Error obteniendo notificaciones:", error)
      return []
    }
  }

  static async marcarComoLeida(notificationId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from("notificaciones")
        .update({
          leida: true,
          fecha_lectura: new Date().toISOString(),
        })
        .eq("id", notificationId)

      return !error
    } catch (error) {
      console.error("Error marcando notificación como leída:", error)
      return false
    }
  }

  static async notificarVencimientoSecuencia(empresaId: string, tipoComprobante: string, diasRestantes: number) {
    await this.enviarNotificacion({
      usuario_id: empresaId,
      tipo: "vencimiento_secuencia",
      titulo: "Secuencia NCF por vencer",
      mensaje: `La secuencia NCF tipo ${tipoComprobante} vence en ${diasRestantes} días. Solicite una nueva secuencia a la DGII.`,
      datos_adicionales: {
        tipo_comprobante: tipoComprobante,
        dias_restantes: diasRestantes,
      },
    })
  }

  static async notificarSecuenciaAgotandose(empresaId: string, tipoComprobante: string, numerosRestantes: number) {
    await this.enviarNotificacion({
      usuario_id: empresaId,
      tipo: "secuencia_agotandose",
      titulo: "Secuencia NCF agotándose",
      mensaje: `La secuencia NCF tipo ${tipoComprobante} tiene solo ${numerosRestantes} números disponibles.`,
      datos_adicionales: {
        tipo_comprobante: tipoComprobante,
        numeros_restantes: numerosRestantes,
      },
    })
  }

  static async notificarComprobanteRechazado(empresaId: string, eNCF: string, motivo: string) {
    await this.enviarNotificacion({
      usuario_id: empresaId,
      tipo: "comprobante_rechazado",
      titulo: "Comprobante rechazado por DGII",
      mensaje: `El comprobante ${eNCF} fue rechazado. Motivo: ${motivo}`,
      datos_adicionales: {
        encf: eNCF,
        motivo,
      },
    })
  }
}
