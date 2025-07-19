import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-client"
import { Logger } from "@/lib/logger"

const logger = new Logger("AuthMiddleware")

export interface AuthContext {
  userId: string
  empresaId: string
  userRole: string
  email: string
}

export async function withAuth(
  request: NextRequest,
  handler: (request: NextRequest, context: AuthContext) => Promise<NextResponse>,
): Promise<NextResponse> {
  try {
    // Get session token from cookie
    const sessionToken = request.cookies.get("session_token")?.value

    if (!sessionToken) {
      logger.warn("No session token provided")
      return NextResponse.json({ success: false, message: "No autorizado" }, { status: 401 })
    }

    // Verify session with database
    const supabase = await createServerClient()
    const { data: session, error } = await supabase
      .from("sesiones_usuario")
      .select(
        `
        *,
        usuarios (
          id,
          empresa_id,
          email,
          rol,
          activo
        )
      `,
      )
      .eq("token_hash", hashToken(sessionToken))
      .gt("fecha_expiracion", new Date().toISOString())
      .eq("activa", true)
      .single()

    if (error || !session || !session.usuarios) {
      logger.warn("Invalid or expired session", { error: error?.message })
      return NextResponse.json({ success: false, message: "Sesión inválida o expirada" }, { status: 401 })
    }

    const user = session.usuarios as any

    if (!user.activo) {
      logger.warn("Inactive user attempted access", { userId: user.id })
      return NextResponse.json({ success: false, message: "Usuario inactivo" }, { status: 401 })
    }

    // Update session last use
    await supabase.from("sesiones_usuario").update({ fecha_ultimo_uso: new Date().toISOString() }).eq("id", session.id)

    // Create auth context
    const authContext: AuthContext = {
      userId: user.id,
      empresaId: user.empresa_id,
      userRole: user.rol,
      email: user.email,
    }

    logger.info("User authenticated successfully", {
      userId: authContext.userId,
      empresaId: authContext.empresaId,
      role: authContext.userRole,
    })

    return await handler(request, authContext)
  } catch (error) {
    logger.error("Authentication middleware error", { error: error instanceof Error ? error.message : "Unknown" })
    return NextResponse.json({ success: false, message: "Error de autenticación" }, { status: 500 })
  }
}

function hashToken(token: string): string {
  const crypto = require("crypto")
  return crypto.createHash("sha256").update(token).digest("hex")
}

export function requireRole(allowedRoles: string[]) {
  return (request: NextRequest, context: AuthContext, handler: Function) => {
    if (!allowedRoles.includes(context.userRole)) {
      logger.warn("Insufficient permissions", {
        userId: context.userId,
        userRole: context.userRole,
        requiredRoles: allowedRoles,
      })
      return NextResponse.json({ success: false, message: "Permisos insuficientes" }, { status: 403 })
    }

    return handler(request, context)
  }
}
