"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit, Search, Trash2, Eye, Star, StarOff, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface Item {
  id: string
  codigo: string
  descripcion: string
  descripcion_corta?: string
  tipo_item: string
  categoria: string
  precio_venta: number
  precio_venta2?: number
  precio_minimo?: number
  tasa_itbis: string
  exento_itbis: boolean
  maneja_inventario: boolean
  stock_actual: number
  stock_minimo: number
  activo: boolean
  es_favorito: boolean
  created_at: string
}

interface ItemsTableProps {
  onEditItem: (item: Item) => void
}

export default function ItemsTable({ onEditItem }: ItemsTableProps) {
  const [items, setItems] = useState<Item[]>([])
  const [filteredItems, setFilteredItems] = useState<Item[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [categoriaFilter, setCategoriaFilter] = useState("todas")
  const [tipoFilter, setTipoFilter] = useState("todos")
  const [estadoFilter, setEstadoFilter] = useState("todos")
  const [loading, setLoading] = useState(true)
  const [categorias, setCategorias] = useState<string[]>([])
  const { toast } = useToast()

  // Cargar items desde la API
  const cargarItems = async () => {
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        categoria: categoriaFilter,
        tipo: tipoFilter,
        estado: estadoFilter,
      })

      const response = await fetch(`/api/items?${params}`)
      const data = await response.json()

      if (data.success) {
        setItems(data.data)
        setFilteredItems(data.data)

        // Extraer categorías únicas
        const categoriasUnicas = Array.from(new Set(data.data.map((item: Item) => item.categoria)))
        setCategorias(categoriasUnicas)
      } else {
        throw new Error(data.error || "Error al cargar items")
      }
    } catch (error) {
      console.error("Error cargando items:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al cargar los items",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Cargar items al montar el componente
  useEffect(() => {
    cargarItems()
  }, [])

  // Filtrar items cuando cambien los filtros
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      cargarItems()
    }, 500) // Debounce de 500ms

    return () => clearTimeout(timeoutId)
  }, [searchTerm, categoriaFilter, tipoFilter, estadoFilter])

  const getTipoItemBadge = (tipo: string) => {
    return tipo === "bien" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
  }

  const getStockBadge = (item: Item) => {
    if (!item.maneja_inventario) return null

    if (item.stock_actual <= item.stock_minimo) {
      return <Badge className="bg-red-100 text-red-800">Stock Bajo</Badge>
    }
    return <Badge className="bg-green-100 text-green-800">Stock OK</Badge>
  }

  const handleEliminarItem = async (id: string) => {
    if (!confirm("¿Está seguro de que desea eliminar este item?")) {
      return
    }

    try {
      const response = await fetch(`/api/items?id=${id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Item eliminado",
          description: "El item ha sido eliminado exitosamente",
        })
        cargarItems() // Recargar la lista
      } else {
        throw new Error(data.error || "Error al eliminar item")
      }
    } catch (error) {
      console.error("Error eliminando item:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al eliminar el item",
        variant: "destructive",
      })
    }
  }

  const toggleFavorito = async (id: string) => {
    try {
      const item = items.find((i) => i.id === id)
      if (!item) return

      const response = await fetch("/api/items", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          es_favorito: !item.es_favorito,
        }),
      })

      const data = await response.json()

      if (data.success) {
        cargarItems() // Recargar la lista
        toast({
          title: item.es_favorito ? "Removido de favoritos" : "Agregado a favoritos",
          description: `${item.descripcion_corta || item.descripcion}`,
        })
      } else {
        throw new Error(data.error || "Error al actualizar favorito")
      }
    } catch (error) {
      console.error("Error actualizando favorito:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al actualizar favorito",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Cargando items...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Catálogo de Items</CardTitle>
        <CardDescription>{filteredItems.length} item(s) encontrado(s)</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código, descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las categorías</SelectItem>
              {categorias.map((categoria) => (
                <SelectItem key={categoria} value={categoria}>
                  {categoria}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={tipoFilter} onValueChange={setTipoFilter}>
            <SelectTrigger className="w-full md:w-32">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="bien">Bienes</SelectItem>
              <SelectItem value="servicio">Servicios</SelectItem>
            </SelectContent>
          </Select>
          <Select value={estadoFilter} onValueChange={setEstadoFilter}>
            <SelectTrigger className="w-full md:w-32">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="activo">Activos</SelectItem>
              <SelectItem value="inactivo">Inactivos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabla */}
        {filteredItems.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>ITBIS</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-sm">{item.codigo}</span>
                        {item.es_favorito && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.descripcion_corta || item.descripcion}</div>
                        {item.descripcion_corta && (
                          <div className="text-xs text-muted-foreground truncate max-w-xs">{item.descripcion}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTipoItemBadge(item.tipo_item)}>
                        {item.tipo_item === "bien" ? "Bien" : "Servicio"}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.categoria}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">RD$ {item.precio_venta.toLocaleString()}</div>
                        {item.precio_venta2 && (
                          <div className="text-xs text-muted-foreground">
                            P2: RD$ {item.precio_venta2.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.exento_itbis ? "secondary" : "default"}>
                        {item.exento_itbis ? "Exento" : `${item.tasa_itbis}%`}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.maneja_inventario ? (
                        <div className="space-y-1">
                          <div className="text-sm font-medium">{item.stock_actual}</div>
                          {getStockBadge(item)}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.activo ? "default" : "secondary"}>
                        {item.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFavorito(item.id)}
                          title={item.es_favorito ? "Quitar de favoritos" : "Agregar a favoritos"}
                        >
                          {item.es_favorito ? (
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          ) : (
                            <StarOff className="h-4 w-4" />
                          )}
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Detalles del Item</DialogTitle>
                              <DialogDescription>Información completa del item</DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-semibold mb-2">Información General</h4>
                                <div className="space-y-2 text-sm">
                                  <div>
                                    <span className="font-medium">Código:</span> {item.codigo}
                                  </div>
                                  <div>
                                    <span className="font-medium">Tipo:</span> {item.tipo_item}
                                  </div>
                                  <div>
                                    <span className="font-medium">Categoría:</span> {item.categoria}
                                  </div>
                                  <div>
                                    <span className="font-medium">Descripción:</span> {item.descripcion}
                                  </div>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-2">Precios e Inventario</h4>
                                <div className="space-y-2 text-sm">
                                  <div>
                                    <span className="font-medium">Precio Venta:</span> RD${" "}
                                    {item.precio_venta.toLocaleString()}
                                  </div>
                                  {item.precio_venta2 && (
                                    <div>
                                      <span className="font-medium">Precio 2:</span> RD${" "}
                                      {item.precio_venta2.toLocaleString()}
                                    </div>
                                  )}
                                  {item.precio_minimo && (
                                    <div>
                                      <span className="font-medium">Precio Mínimo:</span> RD${" "}
                                      {item.precio_minimo.toLocaleString()}
                                    </div>
                                  )}
                                  <div>
                                    <span className="font-medium">ITBIS:</span>{" "}
                                    {item.exento_itbis ? "Exento" : `${item.tasa_itbis}%`}
                                  </div>
                                  {item.maneja_inventario && (
                                    <>
                                      <div>
                                        <span className="font-medium">Stock Actual:</span> {item.stock_actual}
                                      </div>
                                      <div>
                                        <span className="font-medium">Stock Mínimo:</span> {item.stock_minimo}
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button variant="ghost" size="sm" onClick={() => onEditItem(item)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEliminarItem(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No se encontraron items que coincidan con los filtros aplicados.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
