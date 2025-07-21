"use client"

import type React from "react"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Sidebar from "@/components/layout/sidebar"
import Header from "@/components/layout/header"
import MobileNavigation from "@/components/layout/mobile-navigation"
import { createClient } from "@/utils/supabase/client"

interface UserData {
  id: string
  email: string
  user_metadata: any
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthPage = pathname === "/" || pathname === "/auth/login" || pathname === "/auth/register"

  useEffect(() => {
    const verificarAutenticacion = async () => {
      if (isAuthPage) {
        setIsLoading(false)
        return
      }

      try {
        const supabase = createClient()
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()

        if (user && !error) {
          setIsAuthenticated(true)
          setUserData(user)

          // Verificar que el usuario tenga empresa asociada
          try {
            const empresaRes = await fetch("/api/empresa")
            if (empresaRes.status === 404 && pathname !== "/perfil-empresa") {
              router.push("/perfil-empresa")
              return
            }
          } catch (err) {
            console.error("Error comprobando empresa:", err)
          }

          // Guardar en localStorage para compatibilidad con header
          localStorage.setItem("auth_token", "supabase_session")
          localStorage.setItem(
            "user_data",
            JSON.stringify({
              nombre: user.user_metadata?.nombre || "Usuario",
              apellido: user.user_metadata?.apellidos || "",
              email: user.email || "",
              rncEmpresa: "RNC",
            }),
          )

          // Disparar evento para que el header se actualice
          window.dispatchEvent(new Event("userDataUpdated"))
        } else {
          setIsAuthenticated(false)
          setUserData(null)
          localStorage.removeItem("user_data")
          localStorage.removeItem("auth_token")

          // Redirigir a login si no está autenticado
          router.push("/auth/login")
        }
      } catch (error) {
        console.error("Error verificando autenticación:", error)
        setIsAuthenticated(false)
        setUserData(null)
        localStorage.removeItem("user_data")
        localStorage.removeItem("auth_token")
        router.push("/auth/login")
      } finally {
        setIsLoading(false)
      }
    }

    verificarAutenticacion()
  }, [pathname, router, isAuthPage])

  // Mostrar loading mientras verifica autenticación
  if (isLoading && !isAuthPage) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Verificando sesión...</p>
        </div>
      </div>
    )
  }

  // Si es página de auth, mostrar sin layout
  if (isAuthPage) {
    return <>{children}</>
  }

  // Si no está autenticado, no mostrar nada (ya se redirigió)
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Hidden on mobile, visible on desktop */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 via-white to-gray-100">
          <div className="pb-20 lg:pb-0">{children}</div>
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNavigation />
    </div>
  )
}
