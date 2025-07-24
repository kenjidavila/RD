"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell, Search, Settings, LogOut, User, Menu } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"

interface UserData {
  nombre: string
  apellido: string
  email: string
  rncEmpresa: string
}

export default function Header() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const loadUserData = () => {
      try {
        const storedUserData = localStorage.getItem("user_data")
        if (storedUserData) {
          setUserData(JSON.parse(storedUserData))
        }
      } catch (error) {
        console.error("Error loading user data:", error)
      }
    }

    loadUserData()

    // Listen for user data updates
    const handleUserDataUpdate = () => {
      loadUserData()
    }

    window.addEventListener("userDataUpdated", handleUserDataUpdate)

    return () => {
      window.removeEventListener("userDataUpdated", handleUserDataUpdate)
    }
  }, [])

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()

      // Clear localStorage
      localStorage.removeItem("user_data")
      localStorage.removeItem("auth_token")
      localStorage.removeItem("user")

      // Redirect to login
      router.push("/auth/login")
      router.refresh()
    } catch (error) {
      console.error("Error during logout:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getInitials = (nombre: string, apellido: string) => {
    return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase()
  }

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      {/* Left side - Mobile menu button and search */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" className="lg:hidden">
          <Menu className="h-5 w-5" />
        </Button>

        <div className="hidden md:flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2">
          <Search className="h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Buscar..." className="bg-transparent border-none outline-none text-sm w-64" />
        </div>
      </div>

      {/* Right side - Notifications and user menu */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
            3
          </span>
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder-user.jpg" alt="Avatar" />
                <AvatarFallback className="bg-blue-500 text-white">
                  {userData ? getInitials(userData.nombre, userData.apellido) : "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {userData ? `${userData.nombre} ${userData.apellido}` : "Usuario"}
                </p>
                <p className="text-xs leading-none text-muted-foreground">{userData?.email || "email@ejemplo.com"}</p>
                <p className="text-xs leading-none text-muted-foreground">RNC: {userData?.rncEmpresa || "N/A"}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Configuración</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} disabled={isLoading}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>{isLoading ? "Cerrando sesión..." : "Cerrar sesión"}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
