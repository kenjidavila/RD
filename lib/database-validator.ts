import { createServerClient } from "./supabase"

export interface ValidationResult {
  success: boolean
  message: string
  details?: any
}

export interface DatabaseHealth {
  connection: ValidationResult
  tables: ValidationResult
  functions: ValidationResult
  policies: ValidationResult
  performance: ValidationResult
}

export class DatabaseValidator {
  private supabase = createServerClient()

  async validateConnection(): Promise<ValidationResult> {
    try {
      const { data, error } = await this.supabase.from("empresas").select("id").limit(1)

      if (error) {
        return {
          success: false,
          message: `Database connection failed: ${error.message}`,
          details: error,
        }
      }

      return {
        success: true,
        message: "Database connection successful",
      }
    } catch (error) {
      return {
        success: false,
        message: `Connection error: ${error instanceof Error ? error.message : "Unknown error"}`,
        details: error,
      }
    }
  }

  async validateTables(): Promise<ValidationResult> {
    const requiredTables = [
      "empresas",
      "usuarios",
      "sesiones_usuario",
      "comprobantes_fiscales",
      "clientes",
      "items",
      "configuraciones",
      "borradores_comprobantes",
      "actividad_usuarios",
      "estadisticas_empresa",
    ]

    const missingTables: string[] = []
    const tableErrors: Record<string, string> = {}

    for (const table of requiredTables) {
      try {
        const { error } = await this.supabase.from(table).select("*").limit(1)

        if (error) {
          if (error.message.includes("does not exist")) {
            missingTables.push(table)
          } else {
            tableErrors[table] = error.message
          }
        }
      } catch (error) {
        tableErrors[table] = error instanceof Error ? error.message : "Unknown error"
      }
    }

    if (missingTables.length > 0 || Object.keys(tableErrors).length > 0) {
      return {
        success: false,
        message: `Table validation failed`,
        details: {
          missingTables,
          tableErrors,
        },
      }
    }

    return {
      success: true,
      message: `All ${requiredTables.length} required tables exist`,
    }
  }

  async validateFunctions(): Promise<ValidationResult> {
    const requiredFunctions = [
      "registrar_actividad_usuario",
      "actualizar_estadisticas_empresa",
      "get_current_empresa_id",
      "user_belongs_to_empresa",
    ]

    const functionErrors: Record<string, string> = {}

    for (const func of requiredFunctions) {
      try {
        // Intentar llamar la función con parámetros vacíos para verificar que existe
        const { error } = await this.supabase.rpc(func, {})

        // Si el error es sobre parámetros faltantes, la función existe
        if (error && !error.message.includes("missing") && !error.message.includes("required")) {
          functionErrors[func] = error.message
        }
      } catch (error) {
        functionErrors[func] = error instanceof Error ? error.message : "Unknown error"
      }
    }

    if (Object.keys(functionErrors).length > 0) {
      return {
        success: false,
        message: "Function validation failed",
        details: { functionErrors },
      }
    }

    return {
      success: true,
      message: `All ${requiredFunctions.length} required functions exist`,
    }
  }

  async validatePolicies(): Promise<ValidationResult> {
    try {
      // Intentar insertar un registro de prueba para verificar políticas
      const testData = {
        rnc: "TEST123456789",
        razon_social: "Test Company",
        email: "test@example.com",
        activa: true,
      }

      const { error } = await this.supabase.from("empresas").insert(testData).select()

      // Si hay error de política, es lo que esperamos
      if (error && error.message.includes("policy")) {
        return {
          success: true,
          message: "RLS policies are active (insert blocked as expected)",
        }
      }

      // Si no hay error, eliminar el registro de prueba
      if (!error) {
        await this.supabase.from("empresas").delete().eq("rnc", "TEST123456789")

        return {
          success: false,
          message: "RLS policies may not be configured correctly (test insert succeeded)",
          details: { warning: "Tables may be publicly writable" },
        }
      }

      return {
        success: false,
        message: `Policy validation failed: ${error.message}`,
        details: error,
      }
    } catch (error) {
      return {
        success: false,
        message: `Policy validation error: ${error instanceof Error ? error.message : "Unknown error"}`,
        details: error,
      }
    }
  }

  async validatePerformance(): Promise<ValidationResult> {
    try {
      const startTime = Date.now()

      const { error } = await this.supabase.from("empresas").select("id").limit(1)

      const responseTime = Date.now() - startTime

      if (error) {
        return {
          success: false,
          message: `Performance test failed: ${error.message}`,
          details: error,
        }
      }

      const status =
        responseTime < 1000 ? "excellent" : responseTime < 3000 ? "good" : responseTime < 5000 ? "fair" : "poor"

      return {
        success: responseTime < 10000, // Fail if over 10 seconds
        message: `Database response time: ${responseTime}ms (${status})`,
        details: { responseTime, status },
      }
    } catch (error) {
      return {
        success: false,
        message: `Performance test error: ${error instanceof Error ? error.message : "Unknown error"}`,
        details: error,
      }
    }
  }

  async validateAll(): Promise<DatabaseHealth> {
    const [connection, tables, functions, policies, performance] = await Promise.all([
      this.validateConnection(),
      this.validateTables(),
      this.validateFunctions(),
      this.validatePolicies(),
      this.validatePerformance(),
    ])

    return {
      connection,
      tables,
      functions,
      policies,
      performance,
    }
  }
}

export function getDatabaseValidator() {
return new DatabaseValidator()
}
