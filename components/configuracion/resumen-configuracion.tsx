"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { useConfiguracionTabs } from "./configuracion-tabs-context"

const steps = [
  { key: "perfil", label: "Perfil Empresa" },
  { key: "certificados", label: "Certificados" },
  { key: "usuarios", label: "Usuarios" },
  { key: "secuencias", label: "Secuencias NCF" },
  { key: "contingencia", label: "Contingencia" },
  { key: "personalizacion", label: "Personalización" },
] as const

export default function ResumenConfiguracion() {
  const { errors, successes, statuses, goToTab } = useConfiguracionTabs()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumen de Configuración</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {steps.map((s) => {
          const status = statuses[s.key]?.state || "idle"
          const message = statuses[s.key]?.message
          return (
            <div
              key={s.key}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center space-x-2">
                <span>{s.label}</span>
                {message && status === "error" && (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
              </div>
              {status === "success" ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : status === "error" ? (
                <XCircle className="h-4 w-4 text-red-600" />
              ) : status === "pending" ? (
                <span className="text-blue-600">Validando...</span>
              ) : (
                <span className="text-gray-500">Pendiente</span>
              )}
              {status === "error" && message && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => goToTab && goToTab(s.key)}
                  className="ml-2"
                >
                  Ir
                </Button>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
