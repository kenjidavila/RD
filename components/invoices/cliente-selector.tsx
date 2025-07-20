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
import { Search, Users, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Cliente {
  id: string
  rnc_cedula: string
  nombre_razon_social: string
  direccion?: string
  municipio?: string
  provincia?: string
  telefono?: string
  email?: string
  activo: boolean
}

interface ClienteSelectorProps {
  onClienteSelected: (cliente: Cliente) => void
}

export function ClienteSelector({ onClienteSelected }: ClienteSelectorProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)

  // Cargar clientes cuando se abre el dialog
  useEffect(() => {
    if (open) {
      loadClientes()
    }
  }, [open])

  // Filtrar clientes cuando cambia el término de búsqueda
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredClientes(clientes)
    } else {
      const filtered = clientes.filter(
        (cliente) =>
          cliente.nombre_razon_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cliente.rnc_cedula.includes(searchTerm) ||
          cliente.email?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredClientes(filtered)
    }
  }, [searchTerm, clientes])

  const loadClientes = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/clientes?estado=activo&limit=1000")

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || "Error al cargar los clientes")
      }

      const result = await response.json()
      const clientesData = result.data as Cliente[]

      setClientes(clientesData || [])
      setFilteredClientes(clientesData || [])
    } catch (error: any) {
      console.error("Error loading clientes:", error)
      toast({
        title: "Error",
        description: error.message || "Error al cargar los clientes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClienteSelect = (cliente: Cliente) => {
    setSelectedCliente(cliente)
    onClienteSelected(cliente)
    setOpen(false)
    toast({
      title: "Cliente seleccionado",
      description: `${cliente.nombre_razon_social} ha sido seleccionado`,
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Users className="h-4 w-4 mr-2" />
          {selectedCliente ? selectedCliente.nombre_razon_social : "Seleccionar Cliente"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Seleccionar Cliente</DialogTitle>
          <DialogDescription>Busque y seleccione un cliente de su lista</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Barra de búsqueda */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, RNC o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button variant="outline" size="sm" onClick={loadClientes} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Actualizar"}
            </Button>
          </div>

          {/* Lista de clientes */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Cargando clientes...</span>
              </div>
            ) : filteredClientes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No se encontraron clientes</p>
                <p className="text-sm">Agregue clientes en el módulo de Clientes</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredClientes.map((cliente) => (
                  <div
                    key={cliente.id}
                    className="border rounded-lg p-3 hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => handleClienteSelect(cliente)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium">{cliente.nombre_razon_social}</h4>
                        <p className="text-sm text-muted-foreground">RNC: {cliente.rnc_cedula}</p>
                        {cliente.direccion && <p className="text-sm text-muted-foreground">{cliente.direccion}</p>}
                        {cliente.email && <p className="text-sm text-muted-foreground">{cliente.email}</p>}
                      </div>
                      <Badge variant="secondary">{cliente.activo ? "Activo" : "Inactivo"}</Badge>
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
