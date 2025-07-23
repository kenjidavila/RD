"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle } from "lucide-react"
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
  const { errors, successes } = useConfiguracionTabs()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumen de Configuración</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {steps.map((s) => (
          <div
            key={s.key}
            className="flex items-center justify-between text-sm"
          >
            <span>{s.label}</span>
            {successes[s.key] && !errors[s.key] ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : errors[s.key] ? (
              <XCircle className="h-4 w-4 text-red-600" />
            ) : (
              <span className="text-gray-500">Pendiente</span>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
