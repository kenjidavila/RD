import { createClient, createAdminClient } from "@/utils/supabase/server"

// Utilidades específicas para uso en servidor
export class SupabaseServerUtils {
  // Obtener cliente con autenticación de usuario
  static async getAuthenticatedClient() {
    return await createClient()
  }

  // Obtener cliente administrativo
  static getAdminClient() {
    return createAdminClient()
  }

  // Verificar autenticación del usuario
  static async verifyAuth() {
    const supabase = await createClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      throw new Error("Usuario no autenticado")
    }

    return user
  }

  // Obtener empresa del usuario autenticado
  static async getUserEmpresa(userId: string) {
    const supabase = await createClient()

    // Obtener empresa y RNC a través de la tabla de usuarios
    const { data: usuario } = await supabase
      .from("usuarios")
      .select("empresa_id, rnc_cedula, empresas(*)")
      .eq("auth_user_id", userId)
      .maybeSingle()

    if (usuario?.empresas) {
      return usuario.empresas
    }

    // Buscar empresa por owner_id usando el RNC del usuario
    const { data: empresa, error: empresaError } = await supabase
      .from("empresas")
      .select("*")
      .eq("owner_id", usuario?.rnc_cedula || "")
      .maybeSingle()

    if (empresaError || !empresa) {
      throw new Error("Empresa no encontrada")
    }

    return empresa
  }

  // Obtener usuario autenticado y su empresa asociada
  static async getSessionAndEmpresa() {
    const supabase = await createClient()

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      throw new Error("Usuario no autenticado")
    }

    const { data: usuario } = await supabase
      .from("usuarios")
      .select("empresa_id, rnc_cedula, empresas(*)")
      .eq("auth_user_id", user.id)
      .maybeSingle()

    if (usuario?.empresas) {
      return {
        user,
        empresa: usuario.empresas,
        empresaId: usuario.empresas.id,
      }
    }

    // Fallback: buscar empresa por owner_id usando el RNC del usuario
    const { data: empresa, error: empresaError } = await supabase
      .from("empresas")
      .select("*")
      .eq("owner_id", usuario?.rnc_cedula || "")
      .maybeSingle()

    if (empresaError || !empresa) {
      throw new Error("Empresa no encontrada")
    }

    return { user, empresa, empresaId: empresa.id }
  }

  // Verificar permisos de usuario
  static async checkUserPermissions(userId: string, requiredRole?: string) {
    const supabase = await createClient()

    const { data: usuario, error } = await supabase
      .from("usuarios")
      .select("rol, activo")
      .eq("auth_user_id", userId)
      .single()

    if (error || !usuario) {
      throw new Error("Usuario no encontrado")
    }

    if (!usuario.activo) {
      throw new Error("Usuario inactivo")
    }

    if (requiredRole && usuario.rol !== requiredRole) {
      throw new Error("Permisos insuficientes")
    }

    return usuario
  }

  // Operaciones administrativas
  static async createUserWithEmpresa(userData: {
    email: string
    password: string
    nombre: string
    rnc_cedula: string
    empresa: {
      rnc: string
      razon_social: string
      nombre_comercial?: string
    }
  }) {
    const adminClient = createAdminClient()

    // Crear usuario en Auth
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      user_metadata: {
        nombre: userData.nombre,
        rnc_cedula: userData.rnc_cedula,
      },
    })

    if (authError || !authUser.user) {
      throw new Error(`Error creando usuario: ${authError?.message}`)
    }

    // Crear empresa
    const { data: empresa, error: empresaError } = await adminClient
      .from("empresas")
      .insert(userData.empresa)
      .select()
      .single()

    if (empresaError || !empresa) {
      // Rollback: eliminar usuario de Auth
      await adminClient.auth.admin.deleteUser(authUser.user.id)
      throw new Error(`Error creando empresa: ${empresaError?.message}`)
    }

    // Crear registro de usuario en tabla usuarios
    const { error: usuarioError } = await adminClient.from("usuarios").insert({
      id: authUser.user.id,
      empresa_id: empresa.id,
      email: userData.email,
      nombre: userData.nombre,
      rnc_cedula: userData.rnc_cedula,
      rol: "administrador",
    })

    if (usuarioError) {
      // Rollback: eliminar empresa y usuario
      await adminClient.from("empresas").delete().eq("id", empresa.id)
      await adminClient.auth.admin.deleteUser(authUser.user.id)
      throw new Error(`Error creando registro de usuario: ${usuarioError.message}`)
    }

    return {
      user: authUser.user,
      empresa,
    }
  }

  // Limpiar datos expirados
  static async cleanupExpiredData() {
    const adminClient = createAdminClient()

    // Limpiar PDFs expirados
    const { error: pdfError } = await adminClient
      .from("pdf_storage")
      .delete()
      .lt("fecha_expiracion", new Date().toISOString())

    if (pdfError) {
      console.error("Error limpiando PDFs expirados:", pdfError)
    }

    // Limpiar borradores antiguos (más de 30 días)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { error: borradoresError } = await adminClient
      .from("borradores")
      .delete()
      .lt("updated_at", thirtyDaysAgo.toISOString())

    if (borradoresError) {
      console.error("Error limpiando borradores antiguos:", borradoresError)
    }

    return { success: true }
  }

  // Estadísticas del sistema
  static async getSystemStats() {
    const adminClient = createAdminClient()

    const [
      { count: empresasCount },
      { count: usuariosCount },
      { count: comprobantesCount },
      { count: borradoresCount },
    ] = await Promise.all([
      adminClient.from("empresas").select("*", { count: "exact", head: true }),
      adminClient.from("usuarios").select("*", { count: "exact", head: true }),
      adminClient.from("comprobantes_fiscales").select("*", { count: "exact", head: true }),
      adminClient.from("borradores").select("*", { count: "exact", head: true }),
    ])

    return {
      empresas: empresasCount || 0,
      usuarios: usuariosCount || 0,
      comprobantes: comprobantesCount || 0,
      borradores: borradoresCount || 0,
    }
  }
}

// Middleware para verificar autenticación en API Routes
export async function withAuth<T>(handler: (user: any) => Promise<T>): Promise<T> {
  const user = await SupabaseServerUtils.verifyAuth()
  return await handler(user)
}

// Middleware para verificar permisos específicos
export async function withRole<T>(requiredRole: string, handler: (user: any) => Promise<T>): Promise<T> {
  const user = await SupabaseServerUtils.verifyAuth()
  await SupabaseServerUtils.checkUserPermissions(user.id, requiredRole)
  return await handler(user)
}
