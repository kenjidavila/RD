"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Monitor, Smartphone, Tablet, LogOut, Shield, Clock, MapPin } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface SesionActiva {
  id: string
  device_name?: string
  ip_address?: string
  user_agent?: string
  fecha_creacion: string
  fecha_ultimo_uso: string
  es_actual: boolean
}

export function SesionesActivas() {
  const [sesiones, setSesiones] = useState<SesionActiva[]>([])
  const [loading, setLoading] = useState(true)
  const [cerrandoSesion, setCerrandoSesion] = useState<string | null>(null)

  const cargarSesiones = async () => {
    try {
      const response = await fetch("/api/auth/sessions")
      const data = await response.json()

      if (data.success) {
        setSesiones(data.data)
      } else {
        toast({
          title: "Error",
          description: "No se pudieron cargar las sesiones activas",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error cargando sesiones:", error)
      toast({
        title: "Error",
        description: "Error al cargar las sesiones activas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const cerrarSesion = async (sesionId: string) => {
    setCerrandoSesion(sesionId)
    try {
      const response = await fetch("/api/auth/sessions", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sesionId }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Sesión cerrada",
          description: "La sesión ha sido cerrada exitosamente",
        })
        await cargarSesiones() // Recargar la lista
      } else {
        toast({
          title: "Error",
          description: data.message || "No se pudo cerrar la sesión",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error cerrando sesión:", error)
      toast({
        title: "Error",
        description: "Error al cerrar la sesión",
        variant: "destructive",
      })
    } finally {
      setCerrandoSesion(null)
    }
  }

  const getDeviceIcon = (deviceName?: string, userAgent?: string) => {
    const device = deviceName?.toLowerCase() || userAgent?.toLowerCase() || ""

    if (
      device.includes("móvil") ||
      device.includes("mobile") ||
      device.includes("android") ||
      device.includes("iphone")
    ) {
      return <Smartphone className="h-4 w-4" />
    } else if (device.includes("tablet") || device.includes("ipad")) {
      return <Tablet className="h-4 w-4" />
    } else {
      return <Monitor className="h-4 w-4" />
    }
  }

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString("es-DO", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getTimeAgo = (fecha: string) => {
    const now = new Date()
    const sessionDate = new Date(fecha)
    const diffInMinutes = Math.floor((now.getTime() - sessionDate.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Ahora mismo"
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`
    if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)} h`
    return `Hace ${Math.floor(diffInMinutes / 1440)} días`
  }

  useEffect(() => {
    cargarSesiones()

    // Actualizar cada 30 segundos
    const interval = setInterval(cargarSesiones, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Sesiones Activas
          </CardTitle>
          <CardDescription>Cargando sesiones activas...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Sesiones Activas
        </CardTitle>
        <CardDescription>
          Administra tus sesiones activas en diferentes dispositivos. Puedes cerrar sesiones remotamente por seguridad.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sesiones.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay sesiones activas</p>
            </div>
          ) : (
            sesiones.map((sesion) => (
              <div
                key={sesion.id}
                className={`flex items-center justify-between p-4 border rounded-lg ${
                  sesion.es_actual ? "border-blue-200 bg-blue-50" : "border-gray-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">{getDeviceIcon(sesion.device_name, sesion.user_agent)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {sesion.device_name || "Dispositivo desconocido"}
                      </p>
                      {sesion.es_actual && (
                        <Badge variant="default" className="text-xs">
                          Actual
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {sesion.ip_address && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{sesion.ip_address}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Último uso: {getTimeAgo(sesion.fecha_ultimo_uso)}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Iniciada: {formatearFecha(sesion.fecha_creacion)}</p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {!sesion.es_actual && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={cerrandoSesion === sesion.id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                        >
                          <LogOut className="h-4 w-4 mr-1" />
                          {cerrandoSesion === sesion.id ? "Cerrando..." : "Cerrar"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Cerrar sesión?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción cerrará la sesión en{" "}
                            <strong>{sesion.device_name || "el dispositivo seleccionado"}</strong>. El usuario tendrá
                            que iniciar sesión nuevamente en ese dispositivo.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => cerrarSesion(sesion.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Cerrar Sesión
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="mt-6 pt-4 border-t">
          <Button variant="outline" onClick={cargarSesiones} disabled={loading} className="w-full bg-transparent">
            {loading ? "Actualizando..." : "Actualizar Lista"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
