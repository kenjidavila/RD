"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Shield,
  AlertTriangle,
} from "lucide-react"

interface StatData {
  valor: number
  cambio: number
  tendencia: "up" | "down" | "neutral"
}

interface DashboardStats {
  totalEmitidos: StatData
  aceptados: StatData
  rechazados: StatData
  enProceso: StatData
  montoTotal: StatData
}

interface CertificateStatus {
  total: number
  activos: number
  porVencer: number
  vencidos: number
  diasParaVencimiento?: number
}

interface SystemStatus {
  dgiiStatus: "online" | "offline" | "maintenance"
  lastCheck: string
  certificates: CertificateStatus
}

export default function DashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch stats
        const statsResponse = await fetch("/api/dashboard/stats")
        const statsData = await statsResponse.json()

        // Fetch system status
        const systemResponse = await fetch("/api/dashboard/system-status")
        const systemData = await systemResponse.json()

        if (statsData.success) {
          setStats(statsData.data)
        }

        if (systemData.success) {
          setSystemStatus(systemData.data)
        }
      } catch (error) {
        console.error("Error cargando datos:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Actualizar cada 5 minutos
    const interval = setInterval(fetchData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: "DOP",
    }).format(amount)
  }

  const getTrendIcon = (tendencia: string) => {
    switch (tendencia) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return null
    }
  }

  const getTrendColor = (tendencia: string) => {
    switch (tendencia) {
      case "up":
        return "text-green-600"
      case "down":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "text-green-600"
      case "offline":
        return "text-red-600"
      case "maintenance":
        return "text-yellow-600"
      default:
        return "text-gray-600"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "online":
        return "Operativo"
      case "offline":
        return "Fuera de línea"
      case "maintenance":
        return "Mantenimiento"
      default:
        return "Desconocido"
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cargando...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) {
    return <div className="text-center py-8 text-muted-foreground">Error al cargar las estadísticas</div>
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total e-CF Emitidos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmitidos.valor.toLocaleString()}</div>
            <div className={`text-xs flex items-center ${getTrendColor(stats.totalEmitidos.tendencia)}`}>
              {getTrendIcon(stats.totalEmitidos.tendencia)}
              <span className="ml-1">
                {stats.totalEmitidos.cambio > 0 ? "+" : ""}
                {stats.totalEmitidos.cambio.toFixed(1)}% vs mes anterior
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aceptados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.aceptados.valor.toLocaleString()}</div>
            <div className={`text-xs flex items-center ${getTrendColor(stats.aceptados.tendencia)}`}>
              {getTrendIcon(stats.aceptados.tendencia)}
              <span className="ml-1">
                {stats.aceptados.cambio > 0 ? "+" : ""}
                {stats.aceptados.cambio.toFixed(1)}% vs mes anterior
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rechazados</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rechazados.valor.toLocaleString()}</div>
            <div className={`text-xs flex items-center ${getTrendColor(stats.rechazados.tendencia)}`}>
              {getTrendIcon(stats.rechazados.tendencia)}
              <span className="ml-1">
                {stats.rechazados.cambio > 0 ? "+" : ""}
                {stats.rechazados.cambio.toFixed(1)}% vs mes anterior
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Proceso</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.enProceso.valor.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Pendientes de respuesta DGII</p>
          </CardContent>
        </Card>
      </div>

      {/* Estado del Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Estado del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Estado DGII */}
            <div className="space-y-2">
              <h4 className="font-medium">Servicios DGII</h4>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${systemStatus?.dgiiStatus === "online" ? "bg-green-500" : systemStatus?.dgiiStatus === "offline" ? "bg-red-500" : "bg-yellow-500"}`}
                ></div>
                <span className={`text-sm font-medium ${getStatusColor(systemStatus?.dgiiStatus || "offline")}`}>
                  {getStatusText(systemStatus?.dgiiStatus || "offline")}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Última verificación:{" "}
                {systemStatus?.lastCheck ? new Date(systemStatus.lastCheck).toLocaleString() : "No disponible"}
              </p>
            </div>

            {/* Estado Certificados */}
            <div className="space-y-2">
              <h4 className="font-medium">Certificados Digitales</h4>
              {systemStatus?.certificates ? (
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Total:</span>
                    <span className="font-medium">{systemStatus.certificates.total}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Activos:</span>
                    <span className="font-medium text-green-600">{systemStatus.certificates.activos}</span>
                  </div>
                  {systemStatus.certificates.porVencer > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Por vencer:</span>
                      <span className="font-medium text-yellow-600 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {systemStatus.certificates.porVencer}
                      </span>
                    </div>
                  )}
                  {systemStatus.certificates.vencidos > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Vencidos:</span>
                      <span className="font-medium text-red-600 flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        {systemStatus.certificates.vencidos}
                      </span>
                    </div>
                  )}
                  {systemStatus.certificates.diasParaVencimiento &&
                    systemStatus.certificates.diasParaVencimiento <= 30 && (
                      <p className="text-xs text-yellow-600 mt-2">
                        ⚠️ Certificado próximo a vencer en {systemStatus.certificates.diasParaVencimiento} días
                      </p>
                    )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No hay certificados configurados</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monto Total */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monto Total Facturado</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{formatCurrency(stats.montoTotal.valor)}</div>
          <div className={`text-sm flex items-center ${getTrendColor(stats.montoTotal.tendencia)}`}>
            {getTrendIcon(stats.montoTotal.tendencia)}
            <span className="ml-1">
              {stats.montoTotal.cambio > 0 ? "+" : ""}
              {stats.montoTotal.cambio.toFixed(1)}% vs mes anterior
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
