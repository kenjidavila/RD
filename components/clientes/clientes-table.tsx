"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit, Search, Trash2, Eye, Phone, Mail, MapPin, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface Cliente {
  id: string
  rnc_cedula: string
  tipo_documento: string
  razon_social: string
  nombre_comercial?: string
  telefono?: string
  email?: string
  direccion?: string
  provincia?: string
  municipio?: string
  tipo_cliente: string
  limite_credito: number
  dias_credito: number
  exento_itbis: boolean
  activo: boolean
  created_at: string
}

interface ClientesTableProps {
  onEditCliente: (cliente: Cliente) => void
}

export default function ClientesTable({ onEditCliente }: ClientesTableProps) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [tipoFilter, setTipoFilter] = useState("todos")
  const [estadoFilter, setEstadoFilter] = useState("todos")
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Cargar clientes desde la API
  const cargarClientes = async () => {
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        tipo: tipoFilter,
        estado: estadoFilter,
      })

      const response = await fetch(`/api/clientes?${params}`)
      const data = await response.json()

      if (data.success) {
        setClientes(data.data)
        setFilteredClientes(data.data)
      } else {
        throw new Error(data.error || "Error al cargar clientes")
      }
    } catch (error) {
      console.error("Error cargando clientes:", error)
      toast({
        title: "Error",
        description: "Error al cargar los clientes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Cargar clientes al montar el componente
  useEffect(() => {
    cargarClientes()
  }, [])

  // Filtrar clientes cuando cambien los filtros
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      cargarClientes()
    }, 500) // Debounce de 500ms

    return () => clearTimeout(timeoutId)
  }, [searchTerm, tipoFilter, estadoFilter])

  const getTipoClienteBadge = (tipo: string) => {
    const colors = {
      regular: "bg-gray-100 text-gray-800",
      vip: "bg-purple-100 text-purple-800",
      corporativo: "bg-blue-100 text-blue-800",
      gobierno: "bg-green-100 text-green-800",
    }
    return colors[tipo as keyof typeof colors] || colors.regular
  }

  const handleEliminarCliente = async (id: string) => {
    if (!confirm("¿Está seguro de que desea eliminar este cliente?")) {
      return
    }

    try {
      const response = await fetch(`/api/clientes?id=${id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Cliente eliminado",
          description: "El cliente ha sido eliminado exitosamente",
        })
        cargarClientes() // Recargar la lista
      } else {
        throw new Error(data.error || "Error al eliminar cliente")
      }
    } catch (error) {
      console.error("Error eliminando cliente:", error)
      toast({
        title: "Error",
        description: "Error al eliminar el cliente",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Cargando clientes...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lista de Clientes</CardTitle>
        <CardDescription>{filteredClientes.length} cliente(s) encontrado(s)</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, RNC, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={tipoFilter} onValueChange={setTipoFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Tipo de cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los tipos</SelectItem>
              <SelectItem value="regular">Regular</SelectItem>
              <SelectItem value="vip">VIP</SelectItem>
              <SelectItem value="corporativo">Corporativo</SelectItem>
              <SelectItem value="gobierno">Gobierno</SelectItem>
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
        {filteredClientes.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>RNC/Cédula</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Crédito</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClientes.map((cliente) => (
                  <TableRow key={cliente.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{cliente.razon_social}</div>
                        {cliente.nombre_comercial && (
                          <div className="text-sm text-muted-foreground">{cliente.nombre_comercial}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-mono">{cliente.rnc_cedula}</div>
                        <div className="text-xs text-muted-foreground">{cliente.tipo_documento}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {cliente.telefono && (
                          <div className="flex items-center text-sm">
                            <Phone className="h-3 w-3 mr-1" />
                            {cliente.telefono}
                          </div>
                        )}
                        {cliente.email && (
                          <div className="flex items-center text-sm">
                            <Mail className="h-3 w-3 mr-1" />
                            {cliente.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {cliente.provincia && (
                        <div className="flex items-center text-sm">
                          <MapPin className="h-3 w-3 mr-1" />
                          <div>
                            <div>{cliente.municipio}</div>
                            <div className="text-xs text-muted-foreground">{cliente.provincia}</div>
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getTipoClienteBadge(cliente.tipo_cliente)}>
                        {cliente.tipo_cliente.charAt(0).toUpperCase() + cliente.tipo_cliente.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>RD$ {cliente.limite_credito.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">{cliente.dias_credito} días</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={cliente.activo ? "default" : "secondary"}>
                        {cliente.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Detalles del Cliente</DialogTitle>
                              <DialogDescription>Información completa del cliente</DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-semibold mb-2">Información General</h4>
                                <div className="space-y-2 text-sm">
                                  <div>
                                    <span className="font-medium">Razón Social:</span> {cliente.razon_social}
                                  </div>
                                  <div>
                                    <span className="font-medium">RNC/Cédula:</span> {cliente.rnc_cedula}
                                  </div>
                                  <div>
                                    <span className="font-medium">Tipo:</span> {cliente.tipo_cliente}
                                  </div>
                                  {cliente.exento_itbis && (
                                    <div>
                                      <Badge className="bg-yellow-100 text-yellow-800">Exento ITBIS</Badge>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-2">Información de Crédito</h4>
                                <div className="space-y-2 text-sm">
                                  <div>
                                    <span className="font-medium">Límite:</span> RD${" "}
                                    {cliente.limite_credito.toLocaleString()}
                                  </div>
                                  <div>
                                    <span className="font-medium">Días de crédito:</span> {cliente.dias_credito}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button variant="ghost" size="sm" onClick={() => onEditCliente(cliente)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEliminarCliente(cliente.id)}
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
            No se encontraron clientes que coincidan con los filtros aplicados.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
