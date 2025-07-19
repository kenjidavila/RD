import { createServerClient } from "./supabase"

export class BackupService {
  static async crearBackupCompleto(userId: string) {
    try {
      // Check if environment variables are available
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return {
          success: false,
          error: "Configuración de base de datos no disponible",
        }
      }

      const supabase = createServerClient()

      // Get user's company data
      const { data: userData, error: userError } = await supabase
        .from("usuarios")
        .select("empresa_id")
        .eq("id", userId)
        .single()

      if (userError || !userData) {
        return {
          success: false,
          error: "Usuario no encontrado",
        }
      }

      const empresaId = userData.empresa_id

      // Tables to backup
      const tablesToBackup = [
        "empresas",
        "usuarios",
        "comprobantes_fiscales",
        "clientes",
        "items",
        "configuraciones",
        "secuencias_ncf",
        "certificados_digitales",
      ]

      const backupData: any = {}

      // Get data from each table
      for (const table of tablesToBackup) {
        try {
          const { data, error } = await supabase.from(table).select("*").eq("empresa_id", empresaId)

          if (error) {
            console.warn(`Error getting data from ${table}:`, error)
            backupData[table] = []
          } else {
            backupData[table] = data || []
          }
        } catch (error) {
          console.warn(`Error processing table ${table}:`, error)
          backupData[table] = []
        }
      }

      // Create backup metadata
      const backup = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        empresa_id: empresaId,
        usuario_id: userId,
        data: backupData,
        stats: {
          total_tables: tablesToBackup.length,
          total_records: Object.values(backupData).reduce((acc: number, table: any) => acc + (table?.length || 0), 0),
        },
      }

      // Generate backup ID
      const backupId = `backup_${empresaId}_${Date.now()}`

      return {
        success: true,
        backupId,
        backup,
      }
    } catch (error) {
      console.error("Error creating backup:", error)
      return {
        success: false,
        error: "Error interno del servidor",
      }
    }
  }

  static async listarBackups(userId: string) {
    try {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return {
          success: false,
          error: "Configuración de base de datos no disponible",
        }
      }

      const supabase = createServerClient()

      // Get user's backup history from logs
      const { data: logs, error } = await supabase
        .from("logs_sistema")
        .select("*")
        .eq("usuario_id", userId)
        .eq("accion", "backup_creado")
        .order("created_at", { ascending: false })
        .limit(10)

      if (error) {
        throw error
      }

      return {
        success: true,
        backups: logs || [],
      }
    } catch (error) {
      console.error("Error listing backups:", error)
      return {
        success: false,
        error: "Error interno del servidor",
      }
    }
  }
}
