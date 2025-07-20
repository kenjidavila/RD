"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import ClientesTable from "@/components/clientes/clientes-table"
import ClienteForm from "@/components/clientes/cliente-form"
import { Button } from "@/components/ui/button"
import { Plus, Users } from "lucide-react"
import { Loader2 } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

export default function ClientesPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedCliente, setSelectedCliente] = useState(null)
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

  const handleNuevoCliente = () => {
    setSelectedCliente(null)
    setShowForm(true)
  }

  const handleEditarCliente = (cliente: any) => {
    setSelectedCliente(cliente)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setSelectedCliente(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Users className="mr-3 h-8 w-8 text-primary" />
            Gestión de Clientes
          </h1>
          <p className="text-muted-foreground">Administre la información de sus clientes y compradores</p>
        </div>

        <Button onClick={handleNuevoCliente} className="bg-primary hover:bg-primary-700">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Cliente
        </Button>
      </div>

      {showForm ? (
        <ClienteForm cliente={selectedCliente} onClose={handleCloseForm} />
      ) : (
        <ClientesTable onEditCliente={handleEditarCliente} />
      )}
    </div>
  )
}
