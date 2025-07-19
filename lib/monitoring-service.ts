export interface SystemMetrics {
  timestamp: string
  cpu_usage: number
  memory_usage: number
  disk_usage: number
  active_users: number
  comprobantes_procesados_hoy: number
  errores_ultimas_24h: number
  tiempo_respuesta_promedio: number
}

export class MonitoringService {
  private static metrics: SystemMetrics[] = []

  static async obtenerMetricas(): Promise<SystemMetrics> {
    const timestamp = new Date().toISOString()

    // Simular métricas del sistema
    const metrics: SystemMetrics = {
      timestamp,
      cpu_usage: Math.random() * 100,
      memory_usage: Math.random() * 100,
      disk_usage: Math.random() * 100,
      active_users: Math.floor(Math.random() * 50),
      comprobantes_procesados_hoy: Math.floor(Math.random() * 1000),
      errores_ultimas_24h: Math.floor(Math.random() * 10),
      tiempo_respuesta_promedio: Math.random() * 1000,
    }

    this.metrics.push(metrics)

    // Mantener solo las últimas 1000 métricas
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000)
    }

    return metrics
  }

  static async verificarSaludSistema(): Promise<{
    status: "healthy" | "warning" | "critical"
    issues: string[]
    uptime: number
  }> {
    const issues: string[] = []
    let status: "healthy" | "warning" | "critical" = "healthy"

    const metrics = await this.obtenerMetricas()

    // Verificar CPU
    if (metrics.cpu_usage > 90) {
      issues.push("Uso de CPU crítico")
      status = "critical"
    } else if (metrics.cpu_usage > 70) {
      issues.push("Uso de CPU alto")
      if (status === "healthy") status = "warning"
    }

    // Verificar memoria
    if (metrics.memory_usage > 90) {
      issues.push("Uso de memoria crítico")
      status = "critical"
    } else if (metrics.memory_usage > 80) {
      issues.push("Uso de memoria alto")
      if (status === "healthy") status = "warning"
    }

    // Verificar errores
    if (metrics.errores_ultimas_24h > 50) {
      issues.push("Muchos errores en las últimas 24 horas")
      status = "critical"
    } else if (metrics.errores_ultimas_24h > 20) {
      issues.push("Errores elevados en las últimas 24 horas")
      if (status === "healthy") status = "warning"
    }

    return {
      status,
      issues,
      uptime: process.uptime(),
    }
  }

  static async alertarProblemas() {
    const salud = await this.verificarSaludSistema()

    if (salud.status === "critical") {
      // Enviar alertas críticas
      console.error("ALERTA CRÍTICA:", salud.issues)
      // Aquí se implementaría envío de emails, SMS, etc.
    } else if (salud.status === "warning") {
      console.warn("ADVERTENCIA:", salud.issues)
    }
  }
}
