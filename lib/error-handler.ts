// Manejo centralizado de errores para la aplicación
export enum ErrorCode {
  // Errores de autenticación
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",

  // Errores de validación
  VALIDATION_ERROR = "VALIDATION_ERROR",
  REQUIRED_FIELD = "REQUIRED_FIELD",
  INVALID_FORMAT = "INVALID_FORMAT",

  // Errores de base de datos
  DATABASE_ERROR = "DATABASE_ERROR",
  RECORD_NOT_FOUND = "RECORD_NOT_FOUND",
  DUPLICATE_RECORD = "DUPLICATE_RECORD",

  // Errores de negocio
  BUSINESS_RULE_VIOLATION = "BUSINESS_RULE_VIOLATION",
  INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",
  RESOURCE_LIMIT_EXCEEDED = "RESOURCE_LIMIT_EXCEEDED",

  // Errores de integración
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
  DGII_SERVICE_UNAVAILABLE = "DGII_SERVICE_UNAVAILABLE",
  PDF_GENERATION_ERROR = "PDF_GENERATION_ERROR",

  // Errores del sistema
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
  TIMEOUT_ERROR = "TIMEOUT_ERROR",
}

export interface AppError {
  code: ErrorCode
  message: string
  details?: string
  timestamp: string
  requestId?: string
  userId?: string
  context?: Record<string, any>
}

export class ErrorHandler {
  static createError(code: ErrorCode, message: string, details?: string, context?: Record<string, any>): AppError {
    return {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
      context,
    }
  }

  static handleSupabaseError(error: any): AppError {
    if (error.code === "PGRST116") {
      return this.createError(ErrorCode.RECORD_NOT_FOUND, "Registro no encontrado", error.message)
    }

    if (error.code === "23505") {
      return this.createError(ErrorCode.DUPLICATE_RECORD, "Ya existe un registro con estos datos", error.message)
    }

    if (error.code === "42501") {
      return this.createError(
        ErrorCode.INSUFFICIENT_PERMISSIONS,
        "Permisos insuficientes para realizar esta operación",
        error.message,
      )
    }

    return this.createError(ErrorCode.DATABASE_ERROR, "Error en la base de datos", error.message)
  }

  static handleAuthError(error: any): AppError {
    if (error.message?.includes("Invalid login credentials")) {
      return this.createError(ErrorCode.UNAUTHORIZED, "Credenciales inválidas", "Email o contraseña incorrectos")
    }

    if (error.message?.includes("Email not confirmed")) {
      return this.createError(
        ErrorCode.UNAUTHORIZED,
        "Email no confirmado",
        "Por favor confirma tu email antes de iniciar sesión",
      )
    }

    if (error.message?.includes("JWT expired")) {
      return this.createError(ErrorCode.TOKEN_EXPIRED, "Sesión expirada", "Por favor inicia sesión nuevamente")
    }

    return this.createError(ErrorCode.UNAUTHORIZED, "Error de autenticación", error.message)
  }

  static handleValidationError(errors: Record<string, string[]>): AppError {
    const firstError = Object.values(errors)[0]?.[0]
    return this.createError(ErrorCode.VALIDATION_ERROR, "Error de validación", firstError, { validationErrors: errors })
  }

  static handleApiError(error: any, context?: Record<string, any>): AppError {
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      return this.createError(
        ErrorCode.SERVICE_UNAVAILABLE,
        "Servicio no disponible",
        "No se pudo conectar con el servidor",
        context,
      )
    }

    if (error.name === "AbortError") {
      return this.createError(
        ErrorCode.TIMEOUT_ERROR,
        "Tiempo de espera agotado",
        "La operación tardó demasiado en completarse",
        context,
      )
    }

    return this.createError(ErrorCode.INTERNAL_SERVER_ERROR, "Error interno del servidor", error.message, context)
  }

  static logError(error: AppError, userId?: string): void {
    const logData = {
      ...error,
      userId,
      userAgent: typeof window !== "undefined" ? window.navigator.userAgent : undefined,
      url: typeof window !== "undefined" ? window.location.href : undefined,
    }

    if (process.env.NODE_ENV === "development") {
      console.error("Application Error:", logData)
    } else {
      // En producción, enviar a servicio de logging
      console.error(JSON.stringify(logData))
    }
  }

  static getErrorMessage(error: AppError): string {
    const messages: Record<ErrorCode, string> = {
      [ErrorCode.UNAUTHORIZED]: "No tienes autorización para realizar esta acción",
      [ErrorCode.FORBIDDEN]: "Acceso denegado",
      [ErrorCode.TOKEN_EXPIRED]: "Tu sesión ha expirado, por favor inicia sesión nuevamente",
      [ErrorCode.VALIDATION_ERROR]: "Los datos proporcionados no son válidos",
      [ErrorCode.REQUIRED_FIELD]: "Este campo es obligatorio",
      [ErrorCode.INVALID_FORMAT]: "El formato de los datos no es válido",
      [ErrorCode.DATABASE_ERROR]: "Error en la base de datos",
      [ErrorCode.RECORD_NOT_FOUND]: "El registro solicitado no fue encontrado",
      [ErrorCode.DUPLICATE_RECORD]: "Ya existe un registro con estos datos",
      [ErrorCode.BUSINESS_RULE_VIOLATION]: "Esta operación viola las reglas de negocio",
      [ErrorCode.INSUFFICIENT_PERMISSIONS]: "No tienes permisos suficientes para esta operación",
      [ErrorCode.RESOURCE_LIMIT_EXCEEDED]: "Se ha excedido el límite de recursos",
      [ErrorCode.EXTERNAL_SERVICE_ERROR]: "Error en servicio externo",
      [ErrorCode.DGII_SERVICE_UNAVAILABLE]: "El servicio de DGII no está disponible",
      [ErrorCode.PDF_GENERATION_ERROR]: "Error al generar el PDF",
      [ErrorCode.INTERNAL_SERVER_ERROR]: "Error interno del servidor",
      [ErrorCode.SERVICE_UNAVAILABLE]: "Servicio no disponible",
      [ErrorCode.TIMEOUT_ERROR]: "Tiempo de espera agotado",
    }

    return error.message || messages[error.code] || "Ha ocurrido un error inesperado"
  }

  static isRetryableError(error: AppError): boolean {
    const retryableCodes = [
      ErrorCode.SERVICE_UNAVAILABLE,
      ErrorCode.TIMEOUT_ERROR,
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      ErrorCode.DGII_SERVICE_UNAVAILABLE,
    ]

    return retryableCodes.includes(error.code)
  }
}

// Utilidades para React
export function useErrorHandler() {
  const handleError = (error: any, context?: Record<string, any>) => {
    let appError: AppError

    if (error.code && Object.values(ErrorCode).includes(error.code)) {
      appError = error as AppError
    } else if (error.message?.includes("supabase")) {
      appError = ErrorHandler.handleSupabaseError(error)
    } else if (error.message?.includes("auth")) {
      appError = ErrorHandler.handleAuthError(error)
    } else {
      appError = ErrorHandler.handleApiError(error, context)
    }

    ErrorHandler.logError(appError)
    return appError
  }

  return { handleError, ErrorHandler }
}

// Middleware para API Routes
export function withErrorHandling<T>(handler: () => Promise<T>): Promise<T | { error: AppError }> {
  return handler().catch((error) => {
    const appError = ErrorHandler.handleApiError(error)
    ErrorHandler.logError(appError)
    return { error: appError }
  })
}
