"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Search, Package, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/utils/supabase/client"

interface Item {
  id: string
  codigo: string
  descripcion: string
  descripcion_corta?: string
  precio_venta: number
  tipo_item: "bien" | "servicio"
  tasa_itbis: string
  inventario_disponible?: number
  activo: boolean
}

interface ItemSelectorProps {
  onItemSelected: (item: Item) => void
}

export function ItemSelector({ onItemSelected }: ItemSelectorProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Item[]>([])
  const [filteredItems, setFilteredItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // Cargar items cuando se abre el dialog
  useEffect(() => {
    if (open) {
      loadItems()
    }
  }, [open])

  // Filtrar items cuando cambia el término de búsqueda
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredItems(items)
    } else {
      const filtered = items.filter(
        (item) =>
          item.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.descripcion_corta?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredItems(filtered)
    }
  }, [searchTerm, items])

  const loadItems = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      // Obtener el usuario actual
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        console.error("Error getting user:", userError)
        return
      }

      // Obtener empresa del usuario
      const { data: empresa, error: empresaError } = await supabase
        .from("empresas")
        .select("id")
        .eq("id", user.id)
        .single()

      if (empresaError) {
        console.error("Error getting empresa:", empresaError)
        toast({
          title: "Error",
          description: "No se pudo obtener la información de la empresa",
          variant: "destructive",
        })
        return
      }

      // Cargar items de la empresa
      const { data: itemsData, error: itemsError } = await supabase
        .from("items")
        .select("*")
        .eq("empresa_id", empresa.id)
        .eq("activo", true)
        .order("descripcion")

      if (itemsError) {
        console.error("Error loading items:", itemsError)
        toast({
          title: "Error",
          description: "Error al cargar los items",
          variant: "destructive",
        })
        return
      }

      setItems(itemsData || [])
      setFilteredItems(itemsData || [])
    } catch (error) {
      console.error("Error loading items:", error)
      toast({
        title: "Error",
        description: "Error al cargar los items",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleItemSelect = (item: Item) => {
    onItemSelected(item)
    setOpen(false)
    toast({
      title: "Item seleccionado",
      description: `${item.descripcion} ha sido agregado`,
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Package className="h-4 w-4 mr-2" />
          Seleccionar Item
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Seleccionar Item</DialogTitle>
          <DialogDescription>Busque y seleccione un producto o servicio de su catálogo</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Barra de búsqueda */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por descripción o código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button variant="outline" size="sm" onClick={loadItems} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Actualizar"}
            </Button>
          </div>

          {/* Lista de items */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Cargando items...</span>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No se encontraron items</p>
                <p className="text-sm">Agregue productos/servicios en el módulo de Items</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="border rounded-lg p-3 hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => handleItemSelect(item)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{item.descripcion}</h4>
                          <Badge variant={item.tipo_item === "bien" ? "default" : "secondary"}>
                            {item.tipo_item === "bien" ? "Producto" : "Servicio"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">Código: {item.codigo}</p>
                        {item.descripcion_corta && (
                          <p className="text-sm text-muted-foreground">{item.descripcion_corta}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm font-medium text-green-600">RD$ {item.precio_venta.toFixed(2)}</span>
                          <span className="text-sm text-muted-foreground">
                            ITBIS: {item.tasa_itbis === "E" ? "Exento" : `${item.tasa_itbis}%`}
                          </span>
                          {item.inventario_disponible !== undefined && (
                            <span className="text-sm text-muted-foreground">Stock: {item.inventario_disponible}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
