"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Database,
  Shield,
  Settings,
  Users,
  Building2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/utils/supabase/client"
import { authService } from "@/lib/auth"

interface DiagnosticResult {
  name: string
  status: "success" | "warning" | "error"
  message: string
  details?: string
}

interface DiagnosticCategory {
  name: string
  icon: React.ReactNode
  tests: DiagnosticResult[]
}

export default function SystemDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const { toast } = useToast()
  const supabase = createClient()

  const runDiagnostics = async () => {
    setLoading(true)
    setProgress(0)

    const categories: DiagnosticCategory[] = [
      {
        name: "Conexión a Base de Datos",
        icon: <Database className="h-5 w-5" />,
        tests: [],
      },
      {
        name: "Autenticación",
        icon: <Shield className="h-5 w-5" />,
        tests: [],
      },
      {
        name: "Configuración de Empresa",
        icon: <Building2 className="h-5 w-5" />,
        tests: [],
      },
      {
        name: "Gestión de Usuarios",
        icon: <Users className="h-5 w-5" />,
        tests: [],
      },
      {
        name: "Variables de Entorno",
        icon: <Settings className="h-5 w-5" />,
        tests: [],
      },
    ]

    try {
      // Test 1: Conexión a base de datos
      setProgress(20)
      try {
        const { data, error } = await supabase.from("empresas").select("count").limit(1)
        categories[0].tests.push({
          name: "Conexión a Supabase",
          status: error ? "error" : "success",
          message: error ? `Error de conexión: ${error.message}` : "Conexión exitosa",
          details: error ? error.details : undefined,
        })
      } catch (error: any) {
        categories[0].tests.push({
          name: "Conexión a Supabase",
          status: "error",
          message: `Error de conexión: ${error.message}`,
        })
      }

      // Test 2: Autenticación
      setProgress(40)
      try {
        const user = await authService.getCurrentUser()
        categories[1].tests.push({
          name: "Usuario Autenticado",
          status: user ? "success" : "warning",
          message: user ? `Usuario: ${user.email}` : "No hay usuario autenticado",
        })

        if (user) {
          const userData = await authService.getUserData(user.id)
          categories[1].tests.push({
            name: "Datos de Usuario",
            status: userData ? "success" : "error",
            message: userData ? `Rol: ${userData.rol}` : "No se pudieron cargar los datos del usuario",
          })
        }
      } catch (error: any) {
        categories[1].tests.push({
          name: "Sistema de Autenticación",
          status: "error",
          message: `Error: ${error.message}`,
        })
      }

      // Test 3: Configuración de empresa
      setProgress(60)
      try {
        const user = await authService.getCurrentUser()
        if (user) {
          const userData = await authService.getUserData(user.id)
          if (userData?.empresa_id) {
            const { data: empresa, error } = await supabase
              .from("empresas")
              .select("*")
              .eq("id", userData.empresa_id)
              .single()

            categories[2].tests.push({
              name: "Datos de Empresa",
              status: empresa ? "success" : "warning",
              message: empresa ? `Empresa: ${empresa.razon_social}` : "No hay datos de empresa configurados",
            })
          } else {
            categories[2].tests.push({
              name: "Datos de Empresa",
              status: "warning",
              message: "Usuario no tiene empresa asignada",
            })
          }
        }
      } catch (error: any) {
        categories[2].tests.push({
          name: "Configuración de Empresa",
          status: "error",
          message: `Error: ${error.message}`,
        })
      }

      // Test 4: Gestión de usuarios
      setProgress(80)
      try {
        const user = await authService.getCurrentUser()
        if (user) {
          const userData = await authService.getUserData(user.id)
          if (userData?.empresa_id) {
            const result = await authService.getUsers(userData.empresa_id)
            categories[3].tests.push({
              name: "Lista de Usuarios",
              status: result.success ? "success" : "error",
              message: result.success
                ? `${result.data?.length || 0} usuarios encontrados`
                : result.error || "Error desconocido",
            })
          }
        }
      } catch (error: any) {
        categories[3].tests.push({
          name: "Gestión de Usuarios",
          status: "error",
          message: `Error: ${error.message}`,
        })
      }

      // Test 5: Variables de entorno
      setProgress(100)
      const envVars = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"]

      envVars.forEach((envVar) => {
        const value = process.env[envVar]
        categories[4].tests.push({
          name: envVar,
          status: value ? "success" : "error",
          message: value ? "Configurada" : "No configurada",
        })
      })
    } catch (error: any) {
      toast({
        title: "Error en diagnósticos",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setDiagnostics(categories)
      setLoading(false)
    }
  }

  useEffect(() => {
    runDiagnostics()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-100 text-green-800">OK</Badge>
      case "warning":
        return <Badge className="bg-yellow-100 text-yellow-800">Advertencia</Badge>
      case "error":
        return <Badge className="bg-red-100 text-red-800">Error</Badge>
      default:
        return null
    }
  }

  const getOverallStatus = () => {
    const allTests = diagnostics.flatMap((cat) => cat.tests)
    const hasErrors = allTests.some((test) => test.status === "error")
    const hasWarnings = allTests.some((test) => test.status === "warning")

    if (hasErrors) return "error"
    if (hasWarnings) return "warning"
    return "success"
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Diagnósticos del Sistema
              </CardTitle>
              <CardDescription>Verificación del estado y configuración del sistema</CardDescription>
            </div>
            <Button onClick={runDiagnostics} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Ejecutando..." : "Ejecutar Diagnósticos"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="space-y-4">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground text-center">Ejecutando diagnósticos... {progress}%</p>
            </div>
          )}

          {!loading && diagnostics.length > 0 && (
            <div className="space-y-6">
              <Alert
                className={
                  getOverallStatus() === "error"
                    ? "border-red-200 bg-red-50"
                    : getOverallStatus() === "warning"
                      ? "border-yellow-200 bg-yellow-50"
                      : "border-green-200 bg-green-50"
                }
              >
                {getStatusIcon(getOverallStatus())}
                <AlertDescription>
                  <strong>Estado general: </strong>
                  {getOverallStatus() === "error" && "Se encontraron errores críticos que requieren atención"}
                  {getOverallStatus() === "warning" && "Se encontraron advertencias que deberían revisarse"}
                  {getOverallStatus() === "success" && "Todos los sistemas funcionan correctamente"}
                </AlertDescription>
              </Alert>

              {diagnostics.map((category, categoryIndex) => (
                <Card key={categoryIndex}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      {category.icon}
                      {category.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {category.tests.map((test, testIndex) => (
                        <div key={testIndex} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(test.status)}
                            <div>
                              <p className="font-medium">{test.name}</p>
                              <p className="text-sm text-muted-foreground">{test.message}</p>
                              {test.details && <p className="text-xs text-red-600 mt-1">{test.details}</p>}
                            </div>
                          </div>
                          {getStatusBadge(test.status)}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
