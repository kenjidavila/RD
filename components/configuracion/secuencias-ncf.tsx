"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, XCircle, AlertCircle, Plus, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SecuenciaNcf {
  id?: string
  tipo_comprobante: string
  secuencia_inicial: string
  secuencia_final: string
  secuencia_actual: string
  fecha_vencimiento: string
  activa: boolean
  validacion_inicial?: {
    valido: boolean
    mensaje: string
    estado: "validando" | "valido" | "invalido" | "pendiente"
  }
  validacion_final?: {
    valido: boolean
    mensaje: string
    estado: "validando" | "valido" | "invalido" | "pendiente"
  }
}

const TIPOS_COMPROBANTE = [
  { value: "31", label: "Factura de Crédito Fiscal" },
  { value: "32", label: "Factura de Consumo" },
  { value: "33", label: "Nota de Débito" },
  { value: "34", label: "Nota de Crédito" },
  { value: "41", label: "Compras" },
  { value: "43", label: "Gastos Menores" },
  { value: "44", label: "Regímenes Especiales" },
  { value: "45", label: "Gubernamental" },
  { value: "46", label: "Exportaciones" },
  { value: "47", label: "Pagos al Exterior" },
]

export default function SecuenciasNCF() {
  const [secuencias, setSecuencias] = useState<SecuenciaNcf[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [empresaRnc, setEmpresaRnc] = useState<string>("")
  const { toast } = useToast()

  useEffect(() => {
    cargarSecuencias()
    fetchEmpresa()
  }, [])

  const fetchEmpresa = async () => {
    try {
      const res = await fetch("/api/empresa")
      if (res.ok) {
        const result = await res.json()
        setEmpresaRnc(result.data?.rnc || "")
      }
    } catch (error) {
      console.error("Error obteniendo empresa:", error)
    }
  }

  const cargarSecuencias = async () => {
    try {
      const response = await fetch("/api/configuracion/secuencias-ncf")
      if (response.ok) {
        const data = await response.json()
        setSecuencias(data.secuencias || [])
      }
    } catch (error) {
      console.error("Error cargando secuencias:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudieron cargar las secuencias NCF",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const validarNCF = async (ncf: string, tipo: string, campo: "inicial" | "final", index: number) => {
    if (!ncf || ncf.length !== 11) return

    // Actualizar estado a validando
    setSecuencias((prev) =>
      prev.map((sec, i) =>
        i === index
          ? {
              ...sec,
              [`validacion_${campo}`]: {
                valido: false,
                mensaje: "Validando...",
                estado: "validando" as const,
              },
            }
          : sec,
      ),
    )

    try {
      const response = await fetch("/api/dgii/consultar-ncf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ncf: `E${empresaRnc || "000000000"}${tipo}${ncf}`,
          tipo_comprobante: tipo,
        }),
      })

      const result = await response.json()

      setSecuencias((prev) =>
        prev.map((sec, i) =>
          i === index
            ? {
                ...sec,
                [`validacion_${campo}`]: {
                  valido: result.success && result.disponible,
                  mensaje: result.success
                    ? result.disponible
                      ? "NCF disponible para uso"
                      : "NCF ya utilizado o no disponible"
                    : result.error || "Error en validación",
                  estado: result.success
                    ? result.disponible
                      ? ("valido" as const)
                      : ("invalido" as const)
                    : ("invalido" as const),
                },
              }
            : sec,
        ),
      )
    } catch (error) {
      setSecuencias((prev) =>
        prev.map((sec, i) =>
          i === index
            ? {
                ...sec,
                [`validacion_${campo}`]: {
                  valido: false,
                  mensaje: "Error de conexión con DGII",
                  estado: "invalido" as const,
                },
              }
            : sec,
        ),
      )
    }
  }

  const generarSecuenciaActual = (inicial: string, tipo: string) => {
    if (!inicial || inicial.length !== 8) return ""

    // Generar secuencia actual basada en la inicial
    const numero = Number.parseInt(inicial)
    return (numero + 1).toString().padStart(8, "0")
  }

  const agregarSecuencia = () => {
    const nuevaSecuencia: SecuenciaNcf = {
      tipo_comprobante: "",
      secuencia_inicial: "",
      secuencia_final: "",
      secuencia_actual: "",
      fecha_vencimiento: "",
      activa: true,
      validacion_inicial: {
        valido: false,
        mensaje: "Pendiente de validación",
        estado: "pendiente",
      },
      validacion_final: {
        valido: false,
        mensaje: "Pendiente de validación",
        estado: "pendiente",
      },
    }
    setSecuencias([...secuencias, nuevaSecuencia])
  }

  const eliminarSecuencia = (index: number) => {
    setSecuencias(secuencias.filter((_, i) => i !== index))
  }

  const actualizarSecuencia = (index: number, campo: keyof SecuenciaNcf, valor: any) => {
    setSecuencias((prev) =>
      prev.map((sec, i) => {
        if (i === index) {
          const updated = { ...sec, [campo]: valor }

          // Auto-generar secuencia actual cuando se actualiza la inicial
          if (campo === "secuencia_inicial" && valor) {
            updated.secuencia_actual = generarSecuenciaActual(valor, updated.tipo_comprobante)
          }

          return updated
        }
        return sec
      }),
    )
  }

  const guardarSecuencias = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/configuracion/secuencias-ncf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ secuencias }),
      })

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Secuencias NCF guardadas correctamente",
        })
        cargarSecuencias()
      } else {
        throw new Error("Error al guardar")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudieron guardar las secuencias NCF",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const getValidationIcon = (estado: string) => {
    switch (estado) {
      case "validando":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case "valido":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "invalido":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const getValidationBadge = (validacion: any) => {
    if (!validacion) return null

    const variant =
      validacion.estado === "valido"
        ? "default"
        : validacion.estado === "invalido"
          ? "destructive"
          : validacion.estado === "validando"
            ? "secondary"
            : "outline"

    return (
      <Badge variant={variant} className="text-xs">
        {validacion.mensaje}
      </Badge>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Secuencias NCF</CardTitle>
          <CardDescription>Configuración de secuencias de numeración de comprobantes fiscales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Secuencias NCF</CardTitle>
        <CardDescription>
          Configuración de secuencias de numeración de comprobantes fiscales electrónicos. Los NCF se validan
          automáticamente contra los servicios de la DGII.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {secuencias.map((secuencia, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Secuencia {index + 1}</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => eliminarSecuencia(index)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`tipo-${index}`}>Tipo de Comprobante</Label>
                <Select
                  value={secuencia.tipo_comprobante}
                  onValueChange={(value) => actualizarSecuencia(index, "tipo_comprobante", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_COMPROBANTE.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.value} - {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`inicial-${index}`}>Secuencia Inicial</Label>
                <div className="flex space-x-2">
                  <Input
                    id={`inicial-${index}`}
                    value={secuencia.secuencia_inicial}
                    onChange={(e) => actualizarSecuencia(index, "secuencia_inicial", e.target.value)}
                    placeholder="00000001"
                    maxLength={8}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      validarNCF(secuencia.secuencia_inicial, secuencia.tipo_comprobante, "inicial", index)
                    }
                    disabled={!secuencia.secuencia_inicial || !secuencia.tipo_comprobante}
                  >
                    {getValidationIcon(secuencia.validacion_inicial?.estado || "pendiente")}
                  </Button>
                </div>
                {getValidationBadge(secuencia.validacion_inicial)}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`final-${index}`}>Secuencia Final</Label>
                <div className="flex space-x-2">
                  <Input
                    id={`final-${index}`}
                    value={secuencia.secuencia_final}
                    onChange={(e) => actualizarSecuencia(index, "secuencia_final", e.target.value)}
                    placeholder="00001000"
                    maxLength={8}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => validarNCF(secuencia.secuencia_final, secuencia.tipo_comprobante, "final", index)}
                    disabled={!secuencia.secuencia_final || !secuencia.tipo_comprobante}
                  >
                    {getValidationIcon(secuencia.validacion_final?.estado || "pendiente")}
                  </Button>
                </div>
                {getValidationBadge(secuencia.validacion_final)}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`actual-${index}`}>Secuencia Actual</Label>
                <Input
                  id={`actual-${index}`}
                  value={secuencia.secuencia_actual}
                  onChange={(e) => actualizarSecuencia(index, "secuencia_actual", e.target.value)}
                  placeholder="00000001"
                  maxLength={8}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`vencimiento-${index}`}>Fecha de Vencimiento</Label>
                <Input
                  id={`vencimiento-${index}`}
                  type="date"
                  value={secuencia.fecha_vencimiento}
                  onChange={(e) => actualizarSecuencia(index, "fecha_vencimiento", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Estado</Label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={secuencia.activa}
                    onChange={(e) => actualizarSecuencia(index, "activa", e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">{secuencia.activa ? "Activa" : "Inactiva"}</span>
                </div>
              </div>
            </div>

            {/* Información del e-NCF generado */}
            {secuencia.tipo_comprobante && secuencia.secuencia_inicial && (
              <div className="bg-gray-50 p-3 rounded-md">
                <Label className="text-sm font-medium">e-NCF Generado:</Label>
                <p className="text-sm font-mono">
                  E{empresaRnc || "000000000"}
                  {secuencia.tipo_comprobante}
                  {secuencia.secuencia_inicial}
                </p>
              </div>
            )}
          </div>
        ))}

        <div className="flex justify-between">
          <Button variant="outline" onClick={agregarSecuencia}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar Secuencia
          </Button>

          <Button onClick={guardarSecuencias} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Guardar Secuencias
          </Button>
        </div>

        {/* Información adicional */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Información Importante:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Los NCF se validan automáticamente contra los servicios de la DGII</li>
            <li>• La secuencia actual se auto-genera basada en la inicial</li>
            <li>• Los e-NCF siguen el formato: E + RNC + Tipo + Secuencia</li>
            <li>• Las secuencias deben estar autorizadas por la DGII</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
