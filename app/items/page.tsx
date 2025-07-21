"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import ItemsTable from "@/components/items/items-table"
import ItemForm from "@/components/items/item-form"
import { Button } from "@/components/ui/button"
import { Plus, Package } from "lucide-react"
import { Loader2 } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

export default function ItemsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
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

  const handleNuevoItem = () => {
    setSelectedItem(null)
    setShowForm(true)
  }

  const handleEditarItem = (item: any) => {
    setSelectedItem(item)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setSelectedItem(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Package className="mr-3 h-8 w-8 text-primary" />
            Gestión de Items
          </h1>
          <p className="text-muted-foreground">Administre su catálogo de productos y servicios</p>
        </div>

        <Button onClick={handleNuevoItem} className="bg-primary hover:bg-primary-700">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Item
        </Button>
      </div>

      {showForm ? (
        <ItemForm item={selectedItem} onClose={handleCloseForm} />
      ) : (
        <ItemsTable onEditItem={handleEditarItem} />
      )}
    </div>
  )
}
