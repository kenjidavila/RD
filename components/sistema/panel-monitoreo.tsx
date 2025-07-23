"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Activity,
  Server,
  Database,
  Users,
  FileText,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SystemMetrics {
  timestamp: string
  cpu_usage: number
  memory_usage: number
  disk_usage: number
  active_users: number
  comprobantes_procesados_hoy: number
  errores_ultimas_24h: number
  tiempo_respuesta_promedio: number
}

interface SystemHealth {
  status: "healthy" | "warning" | "critical"
  issues: string[]
  uptime: number
}

export default function PanelMonitoreo() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [creatingBackup, setCreatingBackup] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    cargarDatosSistema()
    const interval = setInterval(cargarDatosSistema, 30000) // Actualizar cada 30 segundos
    return () => clearInterval(interval)
  }, [])

  const cargarDatosSistema = async () => {
    try {
      const response = await fetch("/api/sistema/salud")
      const data = await response.json()

      if (data.success) {
        setMetrics(data.data.metricas)
        setHealth(data.data.salud)
      }
    } catch (error) {
      console.error("Error cargando datos del sistema:", error)
    } finally {
      setLoading(false)
    }
  }

  const crearBackup = async () => {
    setCreatingBackup(true)
    try {
      const response = await fetch("/api/backup", {
        method: "POST",
      })
      const data = await response.json()

      if (data.success) {
        toast({
          title: "Backup creado",
          description: `Backup ${data.backupId} creado exitosamente`,
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo crear el backup",
        variant: "destructive",
      })
    } finally {
      setCreatingBackup(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-600"
      case "warning":
        return "text-yellow-600"
      case "critical":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case "critical":
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      default:
        return <Activity className="h-5 w-5 text-gray-600" />
    }
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${minutes}m`
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-8">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Cargando métricas del sistema...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Estado General del Sistema */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Estado del Sistema
              </CardTitle>
              <CardDescription>Monitoreo en tiempo real del sistema de facturación electrónica</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={cargarDatosSistema}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
              <Button onClick={crearBackup} disabled={creatingBackup}>
                {creatingBackup ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Crear Backup
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {health && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {getStatusIcon(health.status)}
                <span className={`font-medium ${getStatusColor(health.status)}`}>
                  {health.status === "healthy" && "Sistema Saludable"}
                  {health.status === "warning" && "Advertencias Detectadas"}
                  {health.status === "critical" && "Problemas Críticos"}
                </span>
                <Badge variant="outline">Uptime: {formatUptime(health.uptime)}</Badge>
              </div>

              {health.issues.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      {health.issues.map((issue, index) => (
                        <div key={index}>• {issue}</div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Métricas del Sistema */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Uso de CPU</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.cpu_usage.toFixed(1)}%</div>
              <Progress value={metrics.cpu_usage} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Uso de Memoria</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.memory_usage.toFixed(1)}%</div>
              <Progress value={metrics.memory_usage} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.active_users}</div>
              <p className="text-xs text-muted-foreground">Conectados ahora</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comprobantes Hoy</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.comprobantes_procesados_hoy}</div>
              <p className="text-xs text-muted-foreground">Procesados</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Información Adicional */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Rendimiento</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics && (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Tiempo de respuesta promedio</span>
                  <span className="text-sm font-medium">{metrics.tiempo_respuesta_promedio.toFixed(0)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Errores (24h)</span>
                  <span className="text-sm font-medium">{metrics.errores_ultimas_24h}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Uso de disco</span>
                  <span className="text-sm font-medium">{metrics.disk_usage.toFixed(1)}%</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <FileText className="h-4 w-4 mr-2" />
                Ver Logs del Sistema
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Database className="h-4 w-4 mr-2" />
                Optimizar Base de Datos
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <RefreshCw className="h-4 w-4 mr-2" />
                Limpiar Caché
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Add named export
export { PanelMonitoreo }
