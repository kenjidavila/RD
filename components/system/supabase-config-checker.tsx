"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react"

interface HealthCheck {
  success: boolean
  message: string
  details?: any
}

interface DatabaseHealth {
  connection: HealthCheck
  tables: HealthCheck
  functions: HealthCheck
  policies: HealthCheck
  performance: HealthCheck
}

interface SystemHealth {
  success: boolean
  timestamp: string
  health: DatabaseHealth
  summary: Record<string, string>
}

export function SupabaseConfigChecker() {
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkHealth = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/system/test-connection")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Health check failed")
      }

      setHealth(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkHealth()
  }, [])

  const getStatusIcon = (success: boolean) => {
    return success ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />
  }

  const getStatusBadge = (success: boolean) => {
    return <Badge variant={success ? "default" : "destructive"}>{success ? "OK" : "FAIL"}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Health Check</h2>
          <p className="text-muted-foreground">Validate database connection and configuration</p>
        </div>
        <Button onClick={checkHealth} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Check Health
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {health && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Database Connection</CardTitle>
              {getStatusIcon(health.health.connection.success)}
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{health.health.connection.message}</p>
                {getStatusBadge(health.health.connection.success)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Database Tables</CardTitle>
              {getStatusIcon(health.health.tables.success)}
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{health.health.tables.message}</p>
                {getStatusBadge(health.health.tables.success)}
              </div>
              {health.health.tables.details && (
                <div className="mt-2 text-xs">
                  {health.health.tables.details.missingTables?.length > 0 && (
                    <p className="text-red-500">Missing: {health.health.tables.details.missingTables.join(", ")}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Database Functions</CardTitle>
              {getStatusIcon(health.health.functions.success)}
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{health.health.functions.message}</p>
                {getStatusBadge(health.health.functions.success)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">RLS Policies</CardTitle>
              {getStatusIcon(health.health.policies.success)}
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{health.health.policies.message}</p>
                {getStatusBadge(health.health.policies.success)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Performance</CardTitle>
              {getStatusIcon(health.health.performance.success)}
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{health.health.performance.message}</p>
                {getStatusBadge(health.health.performance.success)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Status</CardTitle>
              {getStatusIcon(health.success)}
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">System {health.success ? "Healthy" : "Has Issues"}</p>
                {getStatusBadge(health.success)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Last check: {new Date(health.timestamp).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {health && !health.success && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            System health check failed. Please review the issues above and ensure all database tables and policies are
            properly configured.
          </AlertDescription>
        </Alert>
      )}

      {health && health.success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>All system health checks passed. The application is ready for use.</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
