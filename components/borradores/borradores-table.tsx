"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Search, Loader2, FileText, Send, Calendar, User, DollarSign } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface BorradorComprobante {
  id: string
  nombre_borrador: string
  descripcion: string
  datos_comprobante: any
  tipo_comprobante: string
  tipo_comprobante_nombre: string
  monto_total: number
  monto_formateado: string
  cantidad_items: number
  fecha_formateada: string
  updated_at: string
  usuario_info: {
    nombre: string
    email?: string
  }
}

export default function BorradoresTable() {
  const [borradores, setBorradores] = useState<BorradorComprobante[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [tipoFiltro, setTipoFiltro] = useState("todos")
  const { toast } = useToast()
  const router = useRouter()

  const tiposComprobante = [
    { value: "todos", label: "Todos los tipos" },
    { value: "31", label: "Factura de Crédito Fiscal" },
    { value: "32", label: "Factura de Consumo" },
    { value: "33", label: "Nota de Débito" },
    { value: "34", label: "Nota de Crédito" },
    { value: "41", label: "Compras" },
    { value: "43", label: "Gastos Menores" },
    { value: "44", label: "Regímenes Especiales" },
    { value: "45", label: "Gubernamental" },
    { value: "46", label: "Exportaciones" },
    { value: "47", label: "Pagos al Exterior" },
  ]

  const cargarBorradores = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        limite: "50",
        ...(searchTerm && { search: searchTerm }),
        ...(tipoFiltro !== "todos" && { tipo_comprobante: tipoFiltro }),
      })

      const response = await fetch(`/api/borradores?${params}`)
      const data = await response.json()

      if (data.success) {
        setBorradores(data.data)
      } else {
        throw new Error(data.error || "Error cargando borradores")
      }
    } catch (error) {
      console.error("Error cargando borradores:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al cargar los borradores",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarBorradores()
  }, [searchTerm, tipoFiltro])

  const handleEditarBorrador = (borrador: BorradorComprobante) => {
    // Navegar al formulario de emisión con los datos del borrador
    const queryParams = new URLSearchParams({
      borrador_id: borrador.id,
      datos: JSON.stringify(borrador.datos_comprobante),
    })

    router.push(`/emitir?${queryParams}`)
  }

  const handleEliminarBorrador = async (id: string) => {
    if (!confirm("¿Está seguro de que desea eliminar este borrador?")) {
      return
    }

    try {
      const response = await fetch(`/api/borradores?id=${id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Éxito",
          description: "Borrador eliminado exitosamente",
        })
        cargarBorradores()
      } else {
        throw new Error(data.error || "Error eliminando borrador")
      }
    } catch (error) {
      console.error("Error eliminando borrador:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al eliminar el borrador",
        variant: "destructive",
      })
    }
  }

  const getTipoComprobanteColor = (tipo: string) => {
    const colores: Record<string, string> = {
      "31": "bg-blue-100 text-blue-800",
      "32": "bg-green-100 text-green-800",
      "33": "bg-orange-100 text-orange-800",
      "34": "bg-purple-100 text-purple-800",
      "41": "bg-gray-100 text-gray-800",
      "43": "bg-yellow-100 text-yellow-800",
      "44": "bg-pink-100 text-pink-800",
      "45": "bg-indigo-100 text-indigo-800",
      "46": "bg-teal-100 text-teal-800",
      "47": "bg-red-100 text-red-800",
    }
    return colores[tipo] || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros de Búsqueda</CardTitle>
          <CardDescription>Busque y filtre sus borradores guardados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar por nombre o descripción</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Escriba para buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo-filtro">Tipo de Comprobante</Label>
              <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tiposComprobante.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Borradores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Borradores Guardados
          </CardTitle>
          <CardDescription>{borradores.length} borrador(es) encontrado(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Cargando borradores...</span>
            </div>
          ) : borradores.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre del Borrador</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Última Modificación</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {borradores.map((borrador) => (
                    <TableRow key={borrador.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{borrador.nombre_borrador}</div>
                          {borrador.descripcion && (
                            <div className="text-sm text-gray-500 mt-1">{borrador.descripcion}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTipoComprobanteColor(borrador.tipo_comprobante)}>
                          {borrador.tipo_comprobante_nombre}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="font-medium">{borrador.monto_formateado}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                            {borrador.cantidad_items}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          {borrador.fecha_formateada}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <User className="h-4 w-4 text-gray-400" />
                          {borrador.usuario_info.nombre}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditarBorrador(borrador)}
                            className="flex items-center gap-1"
                          >
                            <Send className="h-4 w-4" />
                            Continuar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEliminarBorrador(borrador.id)}
                            className="flex items-center gap-1 text-red-600 hover:text-red-700"
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
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay borradores</h3>
              <p className="text-gray-500 mb-4">
                No se encontraron borradores que coincidan con los criterios de búsqueda.
              </p>
              <Button onClick={() => router.push("/emitir")} className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Crear Nuevo Comprobante
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
