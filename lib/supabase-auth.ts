import { createClient } from "@/utils/supabase/client"

// Funciones de autenticación para uso en componentes cliente
export class SupabaseAuth {
  private static get client() {
   return createClient()
  }

  static async signIn(email: string, password: string) {
    try {
      const { data, error } = await this.client.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      if (error) {
        throw new Error(error.message)
      }

      return { user: data.user, session: data.session }
    } catch (error) {
      console.error("Error signing in:", error)
      throw error
    }
  }

  static async signUp(email: string, password: string, metadata?: Record<string, any>) {
    try {
      const { data, error } = await this.client.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: metadata || {},
        },
      })

      if (error) {
        throw new Error(error.message)
      }

      return { user: data.user, session: data.session }
    } catch (error) {
      console.error("Error signing up:", error)
      throw error
    }
  }

  static async signOut() {
    try {
      const { error } = await this.client.auth.signOut()
      if (error) {
        throw new Error(error.message)
      }
    } catch (error) {
      console.error("Error signing out:", error)
      throw error
    }
  }

  static async getCurrentUser() {
    try {
      const {
        data: { user },
        error,
      } = await this.client.auth.getUser()

      if (error) {
        throw new Error(error.message)
      }

      return user
    } catch (error) {
      console.error("Error getting current user:", error)
      return null
    }
  }

  static async getCurrentSession() {
    try {
      const {
        data: { session },
        error,
      } = await this.client.auth.getSession()

      if (error) {
        throw new Error(error.message)
      }

      return session
    } catch (error) {
      console.error("Error getting current session:", error)
      return null
    }
  }

  static onAuthStateChange(callback: (event: string, session: any) => void) {
    return this.client.auth.onAuthStateChange(callback)
  }
}
