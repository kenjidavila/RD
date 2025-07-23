import { createClient } from "@/utils/supabase/server"
import { createHash, pbkdf2Sync, randomBytes } from "crypto"

interface RegistroEmpresaData {
  empresa_rnc: string
  empresa_razon_social: string
  empresa_nombre_comercial?: string
  empresa_email: string
  empresa_telefono?: string
  empresa_direccion?: string
  empresa_provincia?: string
  empresa_municipio?: string
  usuario_nombre: string
  usuario_apellido: string
  usuario_email: string
  usuario_password: string
  usuario_rnc_cedula: string
  usuario_telefono?: string
}

interface LoginData {
  email: string
  password: string
  device_name?: string
  ip_address?: string
  user_agent?: string
}

interface RegistroResult {
  success: boolean
  message: string
  data?: {
    empresa: any
    usuario: any
  }
  errors?: string[]
}

interface LoginResult {
  success: boolean
  message: string
  data?: {
    user: any
    session: any
  }
  errors?: string[]
}

interface VerificarSesionResult {
  success: boolean
  message?: string
  data?: {
    id: string
    empresa_id: string
    nombre: string
    apellido: string
    email: string
    rol: string
    empresa: any
  }
  usuario?: any
  sesion?: any
  errors?: string[]
}

// Función para hashear contraseñas (mantenida para compatibilidad)
export function hashPassword(password: string): string {
  const salt = randomBytes(32).toString("hex")
  const hash = pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex")
  return `${salt}:${hash}`
}

// Función para verificar contraseñas (mantenida para compatibilidad)
export function verifyPassword(password: string, hashedPassword: string): boolean {
  const [salt, hash] = hashedPassword.split(":")
  const verifyHash = pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex")
  return hash === verifyHash
}

// Función para generar token de sesión (mantenida para compatibilidad)
export function generateSessionToken(): string {
  return randomBytes(32).toString("hex")
}

// Función para hashear token de sesión (mantenida para compatibilidad)
export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

// Función principal de registro con Supabase Auth
export async function registrarEmpresa(data: RegistroEmpresaData): Promise<RegistroResult> {
  const supabase = createClient()

  try {
    console.log("🔄 Iniciando registro de empresa...")
    console.log("📧 Email:", data.usuario_email)
    console.log("🏢 RNC Empresa:", data.empresa_rnc)

    // 1. Verificar que no exista empresa con el mismo RNC
    const { data: empresaExistente, error: errorVerificacion } = await supabase
      .from("empresas")
      .select("id, rnc")
      .eq("rnc", data.empresa_rnc)
      .single()

    if (empresaExistente && !errorVerificacion) {
      console.log("❌ Empresa ya existe con RNC:", data.empresa_rnc)
      return {
        success: false,
        message: "Ya existe una empresa registrada con este RNC",
        errors: ["RNC duplicado"],
      }
    }

    // 2. Crear usuario en Supabase Auth
    console.log("🔐 Creando usuario en Supabase Auth...")
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.usuario_email,
      password: data.usuario_password,
      options: {
        data: {
          nombre: data.usuario_nombre,
          apellido: data.usuario_apellido,
          rnc_cedula: data.usuario_rnc_cedula,
          telefono: data.usuario_telefono,
        },
      },
    })

    if (authError) {
      console.error("❌ Error en Supabase Auth:", authError)
      return {
        success: false,
        message: "Error al crear usuario",
        errors: [authError.message],
      }
    }

    if (!authData.user) {
      console.error("❌ No se pudo crear el usuario")
      return {
        success: false,
        message: "Error al crear usuario",
        errors: ["No se pudo crear el usuario"],
      }
    }

    console.log("✅ Usuario creado en Auth:", authData.user.id)

    // 3. Crear empresa con owner_id (CLAVE: esto resuelve el problema RLS)
    console.log("🏢 Creando empresa con owner_id:", authData.user.id)

    const empresaData = {
      rnc: data.empresa_rnc,
      razon_social: data.empresa_razon_social,
      nombre_comercial: data.empresa_nombre_comercial || null,
      email: data.empresa_email,
      telefono: data.empresa_telefono || null,
      direccion: data.empresa_direccion || null,
      provincia: data.empresa_provincia || null,
      municipio: data.empresa_municipio || null,
      owner_id: data.empresa_rnc,
      activa: true,
      fecha_registro: new Date().toISOString(),
      fecha_actualizacion: new Date().toISOString(),
    }

    console.log("📝 Datos de empresa a insertar:", {
      rnc: empresaData.rnc,
      razon_social: empresaData.razon_social,
      owner_id: empresaData.owner_id,
    })

    // Usar el cliente con el usuario autenticado
    const supabaseAuth = createClient()
    await supabaseAuth.auth.setSession({
      access_token: authData.session?.access_token || "",
      refresh_token: authData.session?.refresh_token || "",
    })

    const { data: empresaCreada, error: empresaError } = await supabaseAuth
      .from("empresas")
      .insert(empresaData)
      .select()
      .single()

    if (empresaError) {
      console.error("❌ Error al crear empresa:", empresaError)
      console.error("📋 Detalles del error:", {
        message: empresaError.message,
        details: empresaError.details,
        hint: empresaError.hint,
        code: empresaError.code,
      })

      // Limpiar usuario de Auth si falla la empresa
      try {
        await supabase.auth.admin.deleteUser(authData.user.id)
        console.log("🧹 Usuario limpiado de Auth")
      } catch (cleanupError) {
        console.error("⚠️ Error al limpiar usuario:", cleanupError)
      }

      return {
        success: false,
        message: "Error al crear empresa",
        errors: [empresaError.message],
      }
    }

    console.log("✅ Empresa creada:", empresaCreada.id)

    // 4. Crear registro en tabla usuarios (para datos adicionales)
    console.log("👤 Creando registro de usuario...")

    const usuarioData = {
      empresa_id: empresaCreada.id,
      auth_user_id: authData.user.id,
      nombre: data.usuario_nombre,
      apellido: data.usuario_apellido,
      email: data.usuario_email,
      password_hash: "supabase_auth", // Ya no necesitamos hash personalizado
      rnc_cedula: data.usuario_rnc_cedula,
      telefono: data.usuario_telefono || null,
      rol: "administrador" as const,
      activo: true,
      email_verificado: false,
      fecha_creacion: new Date().toISOString(),
      fecha_actualizacion: new Date().toISOString(),
    }

    const { data: usuarioCreado, error: usuarioError } = await supabaseAuth
      .from("usuarios")
      .insert(usuarioData)
      .select()
      .single()

    if (usuarioError) {
      console.error("❌ Error al crear usuario en tabla:", usuarioError)

      // Limpiar empresa y usuario de Auth si falla
      try {
        await supabaseAuth.from("empresas").delete().eq("id", empresaCreada.id)
        await supabase.auth.admin.deleteUser(authData.user.id)
        console.log("🧹 Datos limpiados después del error")
      } catch (cleanupError) {
        console.error("⚠️ Error al limpiar datos:", cleanupError)
      }

      return {
        success: false,
        message: "Error al crear datos de usuario",
        errors: [usuarioError.message],
      }
    }

    console.log("✅ Usuario creado en tabla:", usuarioCreado.id)
    console.log("🎉 Registro completado exitosamente")

    return {
      success: true,
      message: "Registro exitoso",
      data: {
        empresa: empresaCreada,
        usuario: usuarioCreado,
      },
    }
  } catch (error) {
    console.error("💥 Error inesperado en registro:", error)
    return {
      success: false,
      message: "Error interno del servidor",
      errors: ["Error inesperado durante el registro"],
    }
  }
}

// Función de inicio de sesión con Supabase Auth
export async function iniciarSesion(data: LoginData): Promise<LoginResult> {
  const supabase = createClient()

  try {
    console.log("🔐 Iniciando sesión para:", data.email)

    // Validar formato de datos
    if (!data.email || !data.password) {
      return {
        success: false,
        message: "Email y contraseña son requeridos",
        errors: ["Datos incompletos"],
      }
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      return {
        success: false,
        message: "Formato de email inválido",
        errors: ["Email inválido"],
      }
    }

    console.log("📧 Enviando credenciales a Supabase Auth...")
    console.log("📋 Datos enviados:", {
      email: data.email,
      password: "***" + data.password.slice(-2), // Solo mostrar últimos 2 caracteres
    })

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      console.error("❌ Error de autenticación:", error)
      return {
        success: false,
        message: "Credenciales inválidas",
        errors: [error.message],
      }
    }

    if (!authData.user || !authData.session) {
      console.error("❌ No se recibieron datos de usuario o sesión")
      return {
        success: false,
        message: "Error en la autenticación",
        errors: ["No se pudo establecer la sesión"],
      }
    }

    console.log("✅ Autenticación exitosa para usuario:", authData.user.id)

    return {
      success: true,
      message: "Inicio de sesión exitoso",
      data: {
        user: authData.user,
        session: authData.session,
      },
    }
  } catch (error) {
    console.error("💥 Error inesperado en inicio de sesión:", error)
    return {
      success: false,
      message: "Error interno del servidor",
      errors: ["Error inesperado durante el inicio de sesión"],
    }
  }
}

// Función para verificar sesión (requerida por el sistema existente)
export async function verificarSesion(token?: string): Promise<VerificarSesionResult> {
  const supabase = createClient()

  try {
    console.log("🔍 Verificando sesión...")

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      console.log("❌ Sesión inválida o expirada")
      return {
        success: false,
        message: "Sesión inválida o expirada",
        errors: ["Sesión inválida o expirada"],
      }
    }

    console.log("👤 Usuario autenticado:", user.id)

    // Obtener datos completos del usuario y empresa
    const { data: datosCompletos, error: errorDatos } = await supabase
      .from("vista_usuario_completo")
      .select("*")
      .single()

    if (errorDatos) {
      console.error("⚠️ Error al obtener datos completos:", errorDatos)

      // Fallback: usar datos básicos del usuario
      return {
        success: true,
        data: {
          id: user.id,
          empresa_id: "",
          nombre: user.user_metadata?.nombre || "",
          apellido: user.user_metadata?.apellido || "",
          email: user.email || "",
          rol: "administrador",
          empresa: null,
        },
      }
    }

    console.log("✅ Datos completos obtenidos")

    return {
      success: true,
      data: {
        id: user.id,
        empresa_id: datosCompletos.empresa_id,
        nombre: datosCompletos.nombre,
        apellido: datosCompletos.apellido,
        email: datosCompletos.email,
        rol: datosCompletos.rol,
        empresa: {
          id: datosCompletos.empresa_id_full,
          rnc: datosCompletos.empresa_rnc,
          razon_social: datosCompletos.empresa_razon_social,
          nombre_comercial: datosCompletos.empresa_nombre_comercial,
          email: datosCompletos.empresa_email,
          activa: datosCompletos.empresa_activa,
        },
      },
      usuario: datosCompletos,
    }
  } catch (error) {
    console.error("💥 Error al verificar sesión:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error al verificar sesión",
      errors: [error instanceof Error ? error.message : "Error al verificar sesión"],
    }
  }
}

// Función para cerrar sesión
export async function cerrarSesion() {
  const supabase = createClient()

  try {
    console.log("🚪 Cerrando sesión...")

    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error("❌ Error al cerrar sesión:", error)
      return {
        success: false,
        message: "Error al cerrar sesión",
        errors: [error.message],
      }
    }

    console.log("✅ Sesión cerrada exitosamente")

    return {
      success: true,
      message: "Sesión cerrada exitosamente",
    }
  } catch (error) {
    console.error("💥 Error al cerrar sesión:", error)
    return {
      success: false,
      message: "Error interno del servidor",
      errors: ["Error inesperado al cerrar sesión"],
    }
  }
}

// Función para obtener usuario actual
export async function obtenerUsuarioActual() {
  const supabase = createClient()

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return null
    }

    // Obtener datos completos del usuario y empresa
    const { data: datosCompletos, error: errorDatos } = await supabase
      .from("vista_usuario_completo")
      .select("*")
      .single()

    if (errorDatos) {
      console.error("Error al obtener datos completos:", errorDatos)
      return {
        id: user.id,
        email: user.email,
        nombre: user.user_metadata?.nombre,
        apellido: user.user_metadata?.apellido,
      }
    }

    return {
      id: user.id,
      email: user.email,
      ...datosCompletos,
    }
  } catch (error) {
    console.error("Error al obtener usuario actual:", error)
    return null
  }
}

// Función para obtener sesiones activas (mantenida para compatibilidad)
export async function obtenerSesionesActivas(usuarioId?: number | string) {
  const supabase = createClient()

  try {
    // Con Supabase Auth, las sesiones se manejan automáticamente
    // Esta función se mantiene para compatibilidad pero retorna datos simulados
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error || !session) {
      return {
        success: true,
        sesiones: [],
      }
    }

    // Simular estructura de sesión para compatibilidad
    const sesionActual = {
      id: session.access_token.substring(0, 10),
      usuario_id: session.user.id,
      device_name: "Navegador Web",
      ip_address: "127.0.0.1",
      user_agent: typeof window !== "undefined" ? window.navigator.userAgent : "Unknown",
      fecha_creacion: new Date(session.user.created_at || Date.now()).toISOString(),
      fecha_expiracion: new Date(
        session.expires_at ? session.expires_at * 1000 : Date.now() + 24 * 60 * 60 * 1000,
      ).toISOString(),
      fecha_ultimo_uso: new Date().toISOString(),
    }

    return {
      success: true,
      sesiones: [sesionActual],
    }
  } catch (error) {
    console.error("Error en obtenerSesionesActivas:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al obtener sesiones activas",
    }
  }
}

// Función para cerrar sesión específica (mantenida para compatibilidad)
export async function cerrarSesionEspecifica(sesionId: number | string, usuarioId?: number | string) {
  const supabase = createClient()

  try {
    // Con Supabase Auth, solo podemos cerrar la sesión actual
    const { error } = await supabase.auth.signOut()

    if (error) {
      return {
        success: false,
        error: `Error al cerrar sesión: ${error.message}`,
      }
    }

    return {
      success: true,
      message: "Sesión cerrada exitosamente",
    }
  } catch (error) {
    console.error("Error en cerrarSesionEspecifica:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al cerrar sesión específica",
    }
  }
}

// Funciones auxiliares mantenidas para compatibilidad
async function registrarIntentoFallido(email: string, ip_address?: string, tipo_error?: string) {
  const supabase = createClient()

  try {
    await supabase.from("intentos_login").insert({
      email,
      ip_address: ip_address || "127.0.0.1",
      exitoso: false,
      tipo_error,
      fecha: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error al registrar intento fallido:", error)
  }
}

async function limpiarSesionesExpiradas(usuarioId: number | string) {
  // Con Supabase Auth, las sesiones se limpian automáticamente
  // Esta función se mantiene para compatibilidad pero no hace nada
  return Promise.resolve()
}
