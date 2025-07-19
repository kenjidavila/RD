"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

interface Cliente {
  nombre: string
  rnc: string
  avatar: string
}

interface ComprobanteReciente {
  id: string
  eNCF: string
  cliente: Cliente
  monto: number
  montoFormateado: string
  estado: string
  fecha: string
  tipoComprobante: string
}

export default function RecentInvoices() {
  const [comprobantes, setComprobantes] = useState<ComprobanteReciente[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecentInvoices = async () => {
      try {
        const response = await fetch("/api/dashboard/recent-invoices")
        const data = await response.json()

        if (data.success) {
          setComprobantes(data.data)
        }
      } catch (error) {
        console.error("Error cargando comprobantes recientes:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecentInvoices()

    // Actualizar cada 2 minutos
    const interval = setInterval(fetchRecentInvoices, 2 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aceptado":
        return "bg-green-100 text-green-800"
      case "en_proceso":
        return "bg-yellow-100 text-yellow-800"
      case "rechazado":
        return "bg-red-100 text-red-800"
      case "aceptado_condicional":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "aceptado":
        return "Aceptado"
      case "en_proceso":
        return "En Proceso"
      case "rechazado":
        return "Rechazado"
      case "aceptado_condicional":
        return "Aceptado Condicional"
      default:
        return status
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Comprobantes Recientes</CardTitle>
          <CardDescription>Últimos e-CF emitidos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
                </div>
                <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Comprobantes Recientes</CardTitle>
          <CardDescription>Últimos e-CF emitidos</CardDescription>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/consultas">
            Ver todos
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {comprobantes.length > 0 ? (
          <div className="space-y-4">
            {comprobantes.map((comprobante) => (
              <div key={comprobante.id} className="flex items-center space-x-4">
                <Avatar>
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {comprobante.cliente.avatar}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{comprobante.cliente.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    {comprobante.eNCF} • {comprobante.fecha}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{comprobante.montoFormateado}</p>
                  <Badge className={getStatusColor(comprobante.estado)} variant="secondary">
                    {getStatusLabel(comprobante.estado)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">No hay comprobantes recientes</div>
        )}
      </CardContent>
    </Card>
  )
}
