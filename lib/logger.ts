export type LogLevel = "debug" | "info" | "warn" | "error"

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  data?: any
  userId?: string
  empresaId?: string
  module?: string
}

export class Logger {
  private module: string

  constructor(module = "app") {
    this.module = module
  }

  private log(level: LogLevel, message: string, data?: any, userId?: string, empresaId?: string) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      userId,
      empresaId,
      module: this.module,
    }

    // En desarrollo, mostrar en consola
    if (process.env.NODE_ENV === "development") {
      const logMethod =
        level === "error"
          ? console.error
          : level === "warn"
            ? console.warn
            : level === "debug"
              ? console.debug
              : console.log

      logMethod(`[${entry.timestamp}] [${level.toUpperCase()}] [${this.module}] ${message}`, data || "")
    }

    // En producción, enviar a servicio de logging
    if (process.env.NODE_ENV === "production") {
      // Aquí se puede integrar con servicios como Vercel Analytics, Sentry, etc.
      this.sendToLoggingService(entry)
    }
  }

  private async sendToLoggingService(entry: LogEntry) {
    try {
      // Implementar envío a servicio de logging externo
      // Por ejemplo: Vercel Analytics, Sentry, LogRocket, etc.

      // Por ahora, solo almacenar críticos en localStorage para debugging
      if (entry.level === "error" && typeof window !== "undefined") {
        const logs = JSON.parse(localStorage.getItem("app_error_logs") || "[]")
        logs.push(entry)
        // Mantener solo los últimos 50 errores
        if (logs.length > 50) {
          logs.splice(0, logs.length - 50)
        }
        localStorage.setItem("app_error_logs", JSON.stringify(logs))
      }
    } catch (error) {
      console.error("Error sending log to service:", error)
    }
  }

  debug(message: string, data?: any, userId?: string, empresaId?: string) {
    this.log("debug", message, data, userId, empresaId)
  }

  info(message: string, data?: any, userId?: string, empresaId?: string) {
    this.log("info", message, data, userId, empresaId)
  }

  warn(message: string, data?: any, userId?: string, empresaId?: string) {
    this.log("warn", message, data, userId, empresaId)
  }

  error(message: string, data?: any, userId?: string, empresaId?: string) {
    this.log("error", message, data, userId, empresaId)
  }

  // Método para logging de operaciones de base de datos
  dbOperation(operation: string, table: string, success: boolean, data?: any, userId?: string, empresaId?: string) {
    const message = `DB ${operation.toUpperCase()} on ${table}: ${success ? "SUCCESS" : "FAILED"}`
    this.log(success ? "info" : "error", message, data, userId, empresaId)
  }

  // Método para logging de operaciones de API
  apiCall(method: string, endpoint: string, statusCode: number, data?: any, userId?: string, empresaId?: string) {
    const message = `API ${method.toUpperCase()} ${endpoint}: ${statusCode}`
    const level: LogLevel = statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info"
    this.log(level, message, data, userId, empresaId)
  }

  // Método para logging de autenticación
  auth(action: string, success: boolean, userId?: string, data?: any) {
    const message = `AUTH ${action.toUpperCase()}: ${success ? "SUCCESS" : "FAILED"}`
    this.log(success ? "info" : "warn", message, data, userId)
  }
}

// Instancia global del logger
export const logger = new Logger("global")

// Factory function para crear loggers específicos por módulo
export function createLogger(module: string): Logger {
  return new Logger(module)
}

// Loggers específicos para módulos principales
export const authLogger = new Logger("auth")
export const dbLogger = new Logger("database")
export const apiLogger = new Logger("api")
export const pdfLogger = new Logger("pdf")
export const dgiiLogger = new Logger("dgii")
