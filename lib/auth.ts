import { createClient } from "@/utils/supabase/client"
import type { User } from "@supabase/supabase-js"

export interface AuthUser {
  id: string
  email: string
  nombre: string
  rol: "admin" | "usuario" | "contador"
  empresa_id: string
  activo: boolean
  created_at: string
  updated_at: string
}

export class AuthService {
  private supabase = createClient()

  async signIn(email: string, password: string) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Obtener datos adicionales del usuario
      const userData = await this.getUserData(data.user.id)

      return {
        success: true,
        user: data.user,
        userData,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      }
    }
  }

  async signUp(
    email: string,
    password: string,
    userData: {
      nombre: string
      rol: "admin" | "usuario" | "contador"
      empresa_id: string
    },
  ) {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        // Crear registro en la tabla usuarios
        const { error: userError } = await this.supabase.from("usuarios").insert({
          id: data.user.id,
          email,
          nombre: userData.nombre,
          rol: userData.rol,
          empresa_id: userData.empresa_id,
          activo: true,
        })

        if (userError) throw userError
      }

      return {
        success: true,
        user: data.user,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      }
    }
  }

  async signOut() {
    try {
      const { error } = await this.supabase.auth.signOut()
      if (error) throw error

      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      }
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser()
      return user
    } catch (error) {
      console.error("Error getting current user:", error)
      return null
    }
  }

  async getUserData(userId: string): Promise<AuthUser | null> {
    try {
      const { data, error } = await this.supabase.from("usuarios").select("*").eq("id", userId).single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error getting user data:", error)
      return null
    }
  }

  async updateUser(userId: string, updates: Partial<AuthUser>) {
    try {
      const { data, error } = await this.supabase
        .from("usuarios")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        data,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      }
    }
  }

  async deleteUser(userId: string) {
    try {
      // Desactivar usuario en lugar de eliminarlo
      const { error } = await this.supabase
        .from("usuarios")
        .update({
          activo: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)

      if (error) throw error

      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      }
    }
  }

  async getUsers(empresaId: string) {
    try {
      const { data, error } = await this.supabase
        .from("usuarios")
        .select("*")
        .eq("empresa_id", empresaId)
        .eq("activo", true)
        .order("created_at", { ascending: false })

      if (error) throw error

      return {
        success: true,
        data,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      }
    }
  }
}

export function getAuthService() {
return new AuthService()
}
