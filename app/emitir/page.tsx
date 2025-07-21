"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import InvoiceForm from "@/components/invoices/invoice-form"
import { Loader2 } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

export default function EmitirPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
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
        <h1 className="text-3xl font-bold tracking-tight">Emitir e-CF</h1>
        <p className="text-muted-foreground">Crear un nuevo comprobante fiscal electrónico</p>
      </div>

      <InvoiceForm />
    </div>
  )
}
