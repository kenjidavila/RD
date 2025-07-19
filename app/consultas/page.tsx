"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import ConsultasForm from "@/components/consultas/consultas-form"
import { Loader2 } from "lucide-react"

export default function ConsultasPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      const authToken = localStorage.getItem("auth_token")
      if (!authToken) {
        router.push("/")
        return
      }
      setIsAuthenticated(true)
      setLoading(false)
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando...</span>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Consultas</h1>
        <p className="text-muted-foreground">Consultar comprobantes fiscales electrónicos emitidos y recibidos</p>
      </div>

      <ConsultasForm />
    </div>
  )
}
