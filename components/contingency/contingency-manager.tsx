"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, Clock, X } from "lucide-react"
import { ContingencyManager, type ContingencyType, type ContingencyEvent } from "@/lib/contingency-manager"

export default function ContingencyManagerComponent() {
  const [contingencyManager] = useState(new ContingencyManager())
  const [contingencyType, setContingencyType] = useState<ContingencyType>("total")
  const [reason, setReason] = useState("")
  const [affectedUnits, setAffectedUnits] = useState("")
  const [activeContingencies, setActiveContingencies] = useState<ContingencyEvent[]>([])

  const handleDeclareContingency = () => {
    if (!reason.trim()) {
      alert("Debe especificar el motivo de la contingencia")
      return
    }

    const units = affectedUnits.trim() ? affectedUnits.split(",").map((u) => u.trim()) : undefined
    const contingencyId = contingencyManager.declareContingency(contingencyType, reason, units)

    setActiveContingencies(contingencyManager.getActiveContingencies())
    setReason("")
    setAffectedUnits("")

    alert(`Contingencia declarada con ID: ${contingencyId}`)
  }

  const handleEndContingency = (contingencyId: string) => {
    const success = contingencyManager.endContingency(contingencyId)
    if (success) {
      setActiveContingencies(contingencyManager.getActiveContingencies())
      alert("Contingencia finalizada exitosamente")
    } else {
      alert("Error finalizando la contingencia")
    }
  }

  const getContingencyTypeLabel = (type: ContingencyType): string => {
    switch (type) {
      case "total":
        return "Total"
      case "partial":
        return "Parcial"
      case "connection":
        return "Conexión"
      default:
        return type
    }
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive ? "bg-red-100 text-red-800 border-red-200" : "bg-green-100 text-green-800 border-green-200"
  }

  return (
    <div className="space-y-6">
      {/* Declarar Contingencia */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-orange-500" />
            Declarar Contingencia
          </CardTitle>
          <CardDescription>
            Declare una situación de contingencia cuando no sea posible emitir e-CF normalmente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contingency-type">Tipo de Contingencia</Label>
              <Select value={contingencyType} onValueChange={(value) => setContingencyType(value as ContingencyType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="total">Total - Afecta toda la operación</SelectItem>
                  <SelectItem value="partial">Parcial - Afecta unidades específicas</SelectItem>
                  <SelectItem value="connection">Conexión - Problemas de conectividad</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {contingencyType === "partial" && (
              <div className="space-y-2">
                <Label htmlFor="affected-units">Unidades Afectadas</Label>
                <Input
                  id="affected-units"
                  placeholder="Separar por comas: Sucursal1, Sucursal2"
                  value={affectedUnits}
                  onChange={(e) => setAffectedUnits(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Motivo de la Contingencia</Label>
            <Textarea
              id="reason"
              placeholder="Describa detalladamente el motivo de la contingencia"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          <Button onClick={handleDeclareContingency} className="w-full md:w-auto">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Declarar Contingencia
          </Button>
        </CardContent>
      </Card>

      {/* Contingencias Activas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="mr-2 h-5 w-5 text-orange-500" />
            Contingencias Activas
          </CardTitle>
          <CardDescription>{activeContingencies.length} contingencia(s) activa(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {activeContingencies.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <p className="text-muted-foreground">No hay contingencias activas</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeContingencies.map((contingency) => (
                <div
                  key={contingency.id}
                  className="flex items-center justify-between p-4 border border-orange-200 rounded-lg bg-orange-50"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(contingency.isActive)}>
                        {contingency.isActive ? "Activa" : "Finalizada"}
                      </Badge>
                      <span className="font-medium">{getContingencyTypeLabel(contingency.type)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{contingency.reason}</p>
                    <p className="text-xs text-muted-foreground">Iniciada: {contingency.startDate.toLocaleString()}</p>
                    {contingency.affectedUnits && (
                      <p className="text-xs text-muted-foreground">Unidades: {contingency.affectedUnits.join(", ")}</p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEndContingency(contingency.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Finalizar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Información sobre Contingencias */}
      <Card>
        <CardHeader>
          <CardTitle>Información sobre Contingencias</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-orange-600">Contingencia Total</h4>
              <p className="text-sm text-muted-foreground">
                Falla de sistema que afecta toda la operación del contribuyente. Se utilizarán NCF serie B.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-orange-600">Contingencia Parcial</h4>
              <p className="text-sm text-muted-foreground">
                Falla que afecta solo algunas sucursales o unidades de negocio específicas.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-orange-600">Problemas de Conexión</h4>
              <p className="text-sm text-muted-foreground">
                Imposibilidad de enviar e-CF a DGII. Los documentos se enviarán al reestablecerse la conexión.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
