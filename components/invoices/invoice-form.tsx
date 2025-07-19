"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Eye, FileText, Save, Send, AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/utils/supabase/client"
import { ClienteSelector } from "./cliente-selector"
import { RNCLookup } from "./rnc-lookup"
import { NCFLookup } from "./ncf-lookup"
import { GuardarBorradorDialog } from "../borradores/guardar-borrador-dialog"

interface ECFDetalle {
  numeroLinea: number
  descripcion: string
  cantidad: number
  precioUnitario: number
  montoItem: number
  tasaITBIS: string
  descuento?: number
  itbisRetenido?: number
  isrRetenido?: number
}

interface ECFData {
  tipoECF: string
  eNCF: string
  fechaEmision: string
  rncEmisor: string
  razonSocialEmisor: string
  nombreComercialEmisor?: string
  direccionEmisor: string
  municipioEmisor: string
  provinciaEmisor: string
  telefonoEmisor?: string
  emailEmisor?: string
  numeroIdentificacionComprador?: string
  razonSocialComprador?: string
  direccionComprador?: string
  municipioComprador?: string
  provinciaComprador?: string
  paisComprador?: string
  detalles: ECFDetalle[]
  montoGravado18: number
  montoGravado16: number
  montoGravado0: number
  montoExento: number
  totalITBIS18: number
  totalITBIS16: number
  totalITBIS0: number
  totalITBISRetenido: number
  totalISRRetenido: number
  montoTotal: number
  condicionPago: string
  formaPago: string
  tipoMoneda: string
  tipoCambio: number
  observaciones?: string
  trackId?: string
  codigoSeguridad?: string
  qrCodeUrl?: string
}

interface EmpresaData {
  rnc: string
  razonSocial: string
  nombreComercial?: string
  direccion: string
  municipio?: string
  provincia?: string
  telefono?: string
  email?: string
}

interface Cliente {
  id: string
  rnc_cedula: string
  nombre_razon_social: string
  direccion?: string
  municipio?: string
  provincia?: string
  telefono?: string
  email?: string
}

interface InvoiceFormProps {
  initialData?: Partial<ECFData>
  onSave?: (data: ECFData) => void
  onEmit?: (data: ECFData) => void
}

// Tipos de e-CF disponibles según los esquemas
const TIPOS_ECF = [
  { value: "31", label: "31 - Factura de Crédito Fiscal Electrónica" },
  { value: "32", label: "32 - Factura de Consumo Electrónica" },
  { value: "33", label: "33 - Nota de Débito Electrónica" },
  { value: "34", label: "34 - Nota de Crédito Electrónica" },
  { value: "41", label: "41 - Compras Electrónico" },
  { value: "43", label: "43 - Gastos Menores Electrónico" },
  { value: "44", label: "44 - Regímenes Especiales Electrónico" },
  { value: "45", label: "45 - Gubernamental Electrónico" },
  { value: "46", label: "46 - Exportaciones Electrónico" },
  { value: "47", label: "47 - Pagos al Exterior Electrónico" },
]

export default function InvoiceForm({ initialData, onSave, onEmit }: InvoiceFormProps) {
  const { toast } = useToast()

  const [empresaData, setEmpresaData] = useState<EmpresaData | null>(null)
  const [loadingEmpresa, setLoadingEmpresa] = useState(true)
  const [formData, setFormData] = useState<ECFData>({
    tipoECF: "31",
    eNCF: "",
    fechaEmision: new Date().toISOString().split("T")[0],
    rncEmisor: "",
    razonSocialEmisor: "",
    nombreComercialEmisor: "",
    direccionEmisor: "",
    municipioEmisor: "",
    provinciaEmisor: "",
    telefonoEmisor: "",
    emailEmisor: "",
    detalles: [],
    montoGravado18: 0,
    montoGravado16: 0,
    montoGravado0: 0,
    montoExento: 0,
    totalITBIS18: 0,
    totalITBIS16: 0,
    totalITBIS0: 0,
    totalITBISRetenido: 0,
    totalISRRetenido: 0,
    montoTotal: 0,
    condicionPago: "CONTADO",
    formaPago: "EFECTIVO",
    tipoMoneda: "DOP",
    tipoCambio: 1,
    ...initialData,
  })

  const [loading, setLoading] = useState(false)
  const [emitting, setEmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [showBorradorDialog, setShowBorradorDialog] = useState(false)

  // Cargar datos de la empresa al inicializar
  useEffect(() => {
    loadEmpresaData()
  }, [])

  const loadEmpresaData = async () => {
    try {
      setLoadingEmpresa(true)
      const supabase = createClient()

      // Obtener el usuario actual
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        console.error("Error getting user:", userError)
        toast({
          title: "Error de autenticación",
          description: "No se pudo obtener la información del usuario",
          variant: "destructive",
        })
        return
      }

      // Buscar empresa del usuario actual
      const { data: empresa, error: empresaError } = await supabase
        .from("empresas")
        .select("*")
        .eq("id", user.id)
        .single()

      if (empresaError) {
        if (empresaError.code === "PGRST116") {
          // No hay empresa configurada
          toast({
            title: "Empresa no configurada",
            description: "Por favor configure los datos de su empresa en Configuración &gt; Perfil de Empresa",
            variant: "destructive",
          })
        } else {
          console.error("Error loading empresa:", empresaError)
          toast({
            title: "Error",
            description: "Error al cargar los datos de la empresa",
            variant: "destructive",
          })
        }
        return
      }

      if (empresa) {
        const empresaFormatted: EmpresaData = {
          rnc: empresa.rnc,
          razonSocial: empresa.razon_social,
          nombreComercial: empresa.nombre_comercial,
          direccion: empresa.direccion,
          municipio: empresa.municipio,
          provincia: empresa.provincia,
          telefono: empresa.telefono,
          email: empresa.email,
        }

        setEmpresaData(empresaFormatted)

        // Actualizar formData con datos de la empresa
        setFormData((prev) => ({
          ...prev,
          rncEmisor: empresa.rnc,
          razonSocialEmisor: empresa.razon_social,
          nombreComercialEmisor: empresa.nombre_comercial || "",
          direccionEmisor: empresa.direccion,
          municipioEmisor: empresa.municipio || "",
          provinciaEmisor: empresa.provincia || "",
          telefonoEmisor: empresa.telefono || "",
          emailEmisor: empresa.email || "",
        }))
      }
    } catch (error) {
      console.error("Error loading empresa data:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de la empresa",
        variant: "destructive",
      })
    } finally {
      setLoadingEmpresa(false)
    }
  }

  // Función para calcular totales
  const calculateTotals = (detalles: ECFDetalle[]) => {
    const totals = {
      montoGravado18: 0,
      montoGravado16: 0,
      montoGravado0: 0,
      montoExento: 0,
      totalITBIS18: 0,
      totalITBIS16: 0,
      totalITBIS0: 0,
      totalITBISRetenido: 0,
      totalISRRetenido: 0,
      montoTotal: 0,
    }

    detalles.forEach((detalle) => {
      const montoItem = detalle.cantidad * detalle.precioUnitario - (detalle.descuento || 0)

      switch (detalle.tasaITBIS) {
        case "18":
          totals.montoGravado18 += montoItem
          totals.totalITBIS18 += montoItem * 0.18
          break
        case "16":
          totals.montoGravado16 += montoItem
          totals.totalITBIS16 += montoItem * 0.16
          break
        case "0":
          totals.montoGravado0 += montoItem
          break
        case "E":
          totals.montoExento += montoItem
          break
      }

      totals.totalITBISRetenido += detalle.itbisRetenido || 0
      totals.totalISRRetenido += detalle.isrRetenido || 0
    })

    totals.montoTotal =
      totals.montoGravado18 +
      totals.montoGravado16 +
      totals.montoGravado0 +
      totals.montoExento +
      totals.totalITBIS18 +
      totals.totalITBIS16 +
      totals.totalITBIS0 -
      totals.totalITBISRetenido -
      totals.totalISRRetenido

    return totals
  }

  // Función para validar datos según el tipo de e-CF
  const validateForm = (): string[] => {
    const errors: string[] = []

    if (!formData.tipoECF) errors.push("Tipo de ECF es requerido")
    if (!formData.fechaEmision) errors.push("Fecha de emisión es requerida")
    if (!formData.rncEmisor) errors.push("RNC del emisor es requerido")
    if (!formData.razonSocialEmisor) errors.push("Razón social del emisor es requerida")
    if (!formData.direccionEmisor) errors.push("Dirección del emisor es requerida")

    // Validaciones específicas por tipo de e-CF
    const tipoECF = formData.tipoECF

    // Para compras (41) y gastos menores (43), el comprador puede ser opcional
    if (!["41", "43"].includes(tipoECF)) {
      if (!formData.numeroIdentificacionComprador && !formData.razonSocialComprador) {
        errors.push("Información del comprador es requerida para este tipo de comprobante")
      }
    }

    // Para exportaciones (46), validaciones especiales
    if (tipoECF === "46") {
      if (!formData.paisComprador) {
        errors.push("País del comprador es requerido para exportaciones")
      }
      if (formData.tipoMoneda === "DOP") {
        errors.push("Las exportaciones deben ser en moneda extranjera")
      }
    }

    // Para pagos al exterior (47), validaciones especiales
    if (tipoECF === "47") {
      if (!formData.paisComprador) {
        errors.push("País de destino es requerido para pagos al exterior")
      }
    }

    if (formData.detalles.length === 0) {
      errors.push("Debe agregar al menos un detalle")
    }

    formData.detalles.forEach((detalle, index) => {
      if (!detalle.descripcion) errors.push(`Detalle ${index + 1}: Descripción es requerida`)
      if (detalle.cantidad <= 0) errors.push(`Detalle ${index + 1}: Cantidad debe ser mayor a 0`)
      if (detalle.precioUnitario <= 0) errors.push(`Detalle ${index + 1}: Precio unitario debe ser mayor a 0`)
    })

    return errors
  }

  // Recalcular totales cuando cambien los detalles
  useEffect(() => {
    const totals = calculateTotals(formData.detalles)
    setFormData((prev) => ({ ...prev, ...totals }))
  }, [formData.detalles])

  // Validar formulario en tiempo real
  useEffect(() => {
    const errors = validateForm()
    setValidationErrors(errors)
  }, [formData])

  const handleInputChange = (field: keyof ECFData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleDetalleChange = (index: number, field: keyof ECFDetalle, value: any) => {
    setFormData((prev) => {
      const newDetalles = [...prev.detalles]
      newDetalles[index] = {
        ...newDetalles[index],
        [field]: value,
      }

      // Recalcular montoItem si cambia cantidad o precio
      if (field === "cantidad" || field === "precioUnitario") {
        newDetalles[index].montoItem = newDetalles[index].cantidad * newDetalles[index].precioUnitario
      }

      return { ...prev, detalles: newDetalles }
    })
  }

  const addDetalle = () => {
    const newDetalle: ECFDetalle = {
      numeroLinea: formData.detalles.length + 1,
      descripcion: "",
      cantidad: 1,
      precioUnitario: 0,
      montoItem: 0,
      tasaITBIS: "18",
    }

    setFormData((prev) => ({
      ...prev,
      detalles: [...prev.detalles, newDetalle],
    }))
  }

  const removeDetalle = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      detalles: prev.detalles.filter((_, i) => i !== index),
    }))
  }

  const handleClienteSelected = (cliente: Cliente) => {
    handleInputChange("numeroIdentificacionComprador", cliente.rnc_cedula)
    handleInputChange("razonSocialComprador", cliente.nombre_razon_social)
    handleInputChange("direccionComprador", cliente.direccion)
    handleInputChange("municipioComprador", cliente.municipio)
    handleInputChange("provinciaComprador", cliente.provincia)
  }

  const handleRNCFound = (data: any) => {
    handleInputChange("numeroIdentificacionComprador", data.rnc)
    handleInputChange("razonSocialComprador", data.razonSocial)
  }

  const handleNCFFound = (ncf: string) => {
    handleInputChange("eNCF", ncf)
  }

  const handlePreview = async () => {
    try {
      setLoading(true)

      const errors = validateForm()
      if (errors.length > 0) {
        toast({
          title: "Errores de validación",
          description: errors.join(", "),
          variant: "destructive",
        })
        return
      }

      const response = await fetch("/api/generate-pdf-preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ecfData: formData,
          empresaData,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al generar vista previa")
      }

      // Abrir PDF en nueva ventana
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      window.open(url, "_blank")

      toast({
        title: "Vista previa generada",
        description: "Se ha abierto la vista previa del documento",
      })
    } catch (error) {
      console.error("Error generating preview:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al generar vista previa",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setLoading(true)

      const errors = validateForm()
      if (errors.length > 0) {
        toast({
          title: "Errores de validación",
          description: errors.join(", "),
          variant: "destructive",
        })
        return
      }

      const response = await fetch("/api/borradores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tipo_documento: formData.tipoECF,
          e_ncf: formData.eNCF,
          datos_ecf: formData,
          observaciones: formData.observaciones || "",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al guardar borrador")
      }

      const result = await response.json()

      toast({
        title: "Borrador guardado",
        description: `Borrador guardado con ID: ${result.id}`,
      })

      if (onSave) {
        onSave(formData)
      }
    } catch (error) {
      console.error("Error saving draft:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al guardar borrador",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEmit = async () => {
    try {
      setEmitting(true)

      const errors = validateForm()
      if (errors.length > 0) {
        toast({
          title: "Errores de validación",
          description: errors.join(", "),
          variant: "destructive",
        })
        return
      }

      // Emitir comprobante
      const emitResponse = await fetch("/api/comprobantes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tipo_ecf: formData.tipoECF,
          datos_ecf: formData,
        }),
      })

      if (!emitResponse.ok) {
        const errorData = await emitResponse.json()
        throw new Error(errorData.error || "Error al emitir comprobante")
      }

      const emitResult = await emitResponse.json()

      // Generar PDF final
      const pdfResponse = await fetch("/api/generate-pdf-final", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ecfData: {
            ...formData,
            trackId: emitResult.trackId,
            codigoSeguridad: emitResult.codigoSeguridad,
            qrCodeUrl: emitResult.qrCodeUrl,
          },
          empresaData,
          incluirQR: true,
        }),
      })

      if (pdfResponse.ok) {
        const blob = await pdfResponse.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `e-CF_${formData.eNCF}_${emitResult.trackId}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }

      toast({
        title: "Comprobante emitido exitosamente",
        description: `TrackID: ${emitResult.trackId}`,
      })

      if (onEmit) {
        onEmit({
          ...formData,
          trackId: emitResult.trackId,
          codigoSeguridad: emitResult.codigoSeguridad,
          qrCodeUrl: emitResult.qrCodeUrl,
        })
      }

      // Limpiar formulario
      setFormData({
        ...formData,
        eNCF: "",
        detalles: [],
        montoTotal: 0,
        observaciones: "",
        numeroIdentificacionComprador: "",
        razonSocialComprador: "",
        direccionComprador: "",
        municipioComprador: "",
        provinciaComprador: "",
        paisComprador: "",
      })
    } catch (error) {
      console.error("Error emitting invoice:", error)
      toast({
        title: "Error de emisión",
        description: error instanceof Error ? error.message : "Error al emitir comprobante",
        variant: "destructive",
      })
    } finally {
      setEmitting(false)
    }
  }

  // Determinar si mostrar campos específicos según el tipo de e-CF
  const shouldShowCompradorFields = !["41", "43"].includes(formData.tipoECF)
  const shouldShowExportFields = ["46", "47"].includes(formData.tipoECF)

  if (loadingEmpresa) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Cargando datos de la empresa...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!empresaData) {
    return (
      <Card>
        <CardContent className="py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No se han configurado los datos de la empresa. Por favor vaya a{" "}
              <strong>Configuración &gt; Perfil de Empresa</strong> para configurar los datos necesarios.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Errores de validación */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Información del documento */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Documento</CardTitle>
          <CardDescription>Datos básicos del comprobante fiscal electrónico</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="tipoECF">Tipo de ECF</Label>
              <Select value={formData.tipoECF} onValueChange={(value) => handleInputChange("tipoECF", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_ECF.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="eNCF">e-NCF</Label>
              <div className="flex gap-2">
                <Input
                  id="eNCF"
                  value={formData.eNCF}
                  onChange={(e) => handleInputChange("eNCF", e.target.value)}
                  placeholder={`E${formData.tipoECF}0000000001`}
                />
                <NCFLookup onNCFFound={handleNCFFound} />
              </div>
            </div>

            <div>
              <Label htmlFor="fechaEmision">Fecha de Emisión</Label>
              <Input
                id="fechaEmision"
                type="date"
                value={formData.fechaEmision}
                onChange={(e) => handleInputChange("fechaEmision", e.target.value)}
              />
            </div>
          </div>

          {/* Campos adicionales para exportaciones y pagos al exterior */}
          {shouldShowExportFields && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipoMoneda">Tipo de Moneda</Label>
                <Select value={formData.tipoMoneda} onValueChange={(value) => handleInputChange("tipoMoneda", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar moneda" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD - Dólar Estadounidense</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="CAD">CAD - Dólar Canadiense</SelectItem>
                    <SelectItem value="DOP">DOP - Peso Dominicano</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tipoCambio">Tipo de Cambio</Label>
                <Input
                  id="tipoCambio"
                  type="number"
                  step="0.01"
                  value={formData.tipoCambio}
                  onChange={(e) => handleInputChange("tipoCambio", Number.parseFloat(e.target.value) || 1)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Información del comprador - Solo mostrar si es necesario */}
      {shouldShowCompradorFields && (
        <Card>
          <CardHeader>
            <CardTitle>Información del Comprador</CardTitle>
            <CardDescription>Datos del cliente o comprador</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <ClienteSelector onClienteSelected={handleClienteSelected} />
              <RNCLookup onRNCFound={handleRNCFound} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="numeroIdentificacionComprador">RNC/Cédula</Label>
                <Input
                  id="numeroIdentificacionComprador"
                  value={formData.numeroIdentificacionComprador || ""}
                  onChange={(e) => handleInputChange("numeroIdentificacionComprador", e.target.value)}
                  placeholder="000000000"
                />
              </div>

              <div>
                <Label htmlFor="razonSocialComprador">Razón Social/Nombre</Label>
                <Input
                  id="razonSocialComprador"
                  value={formData.razonSocialComprador || ""}
                  onChange={(e) => handleInputChange("razonSocialComprador", e.target.value)}
                  placeholder="Nombre del cliente"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="direccionComprador">Dirección</Label>
              <Input
                id="direccionComprador"
                value={formData.direccionComprador || ""}
                onChange={(e) => handleInputChange("direccionComprador", e.target.value)}
                placeholder="Dirección del cliente"
              />
            </div>

            {/* Campo país para exportaciones */}
            {shouldShowExportFields && (
              <div>
                <Label htmlFor="paisComprador">País</Label>
                <Input
                  id="paisComprador"
                  value={formData.paisComprador || ""}
                  onChange={(e) => handleInputChange("paisComprador", e.target.value)}
                  placeholder="País de destino"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Detalles de la factura */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Detalles de la Factura</CardTitle>
              <CardDescription>Productos o servicios facturados</CardDescription>
            </div>
            <Button onClick={addDetalle} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {formData.detalles.map((detalle, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <Badge variant="outline">Item {index + 1}</Badge>
                  <Button variant="ghost" size="sm" onClick={() => removeDetalle(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <Label>Descripción</Label>
                    <Input
                      value={detalle.descripcion}
                      onChange={(e) => handleDetalleChange(index, "descripcion", e.target.value)}
                      placeholder="Descripción del producto/servicio"
                    />
                  </div>

                  <div>
                    <Label>Cantidad</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={detalle.cantidad}
                      onChange={(e) => handleDetalleChange(index, "cantidad", Number.parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div>
                    <Label>Precio Unitario</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={detalle.precioUnitario}
                      onChange={(e) =>
                        handleDetalleChange(index, "precioUnitario", Number.parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>

                  <div>
                    <Label>Tasa ITBIS</Label>
                    <Select
                      value={detalle.tasaITBIS}
                      onValueChange={(value) => handleDetalleChange(index, "tasaITBIS", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="E">Exento</SelectItem>
                        <SelectItem value="0">0%</SelectItem>
                        <SelectItem value="16">16%</SelectItem>
                        <SelectItem value="18">18%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Monto Total</Label>
                    <Input value={`$${detalle.montoItem.toFixed(2)}`} disabled />
                  </div>
                </div>
              </div>
            ))}

            {formData.detalles.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                No hay items agregados. Haz clic en "Agregar Item" para comenzar.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Totales */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Totales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label>Gravado 18%</Label>
              <Input value={`$${formData.montoGravado18.toFixed(2)}`} disabled />
            </div>
            <div>
              <Label>ITBIS 18%</Label>
              <Input value={`$${formData.totalITBIS18.toFixed(2)}`} disabled />
            </div>
            <div>
              <Label>Gravado 16%</Label>
              <Input value={`$${formData.montoGravado16.toFixed(2)}`} disabled />
            </div>
            <div>
              <Label>ITBIS 16%</Label>
              <Input value={`$${formData.totalITBIS16.toFixed(2)}`} disabled />
            </div>
            <div>
              <Label>Exento</Label>
              <Input value={`$${formData.montoExento.toFixed(2)}`} disabled />
            </div>
            <div className="md:col-span-2">
              <Label className="text-lg font-semibold">Total General</Label>
              <Input
                value={`$${formData.montoTotal.toFixed(2)}`}
                disabled
                className="text-lg font-bold text-green-600"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Observaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Observaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.observaciones || ""}
            onChange={(e) => handleInputChange("observaciones", e.target.value)}
            placeholder="Observaciones adicionales..."
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Acciones */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 justify-end">
            <Button variant="outline" onClick={handlePreview} disabled={loading || validationErrors.length > 0}>
              <Eye className="h-4 w-4 mr-2" />
              {loading ? "Generando..." : "Vista Previa"}
            </Button>

            <Button
              variant="outline"
              onClick={() => setShowBorradorDialog(true)}
              disabled={loading || validationErrors.length > 0}
            >
              <Save className="h-4 w-4 mr-2" />
              Guardar Borrador
            </Button>

            <Button onClick={handleEmit} disabled={emitting || validationErrors.length > 0}>
              {emitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Emitiendo...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Emitir Comprobante
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialog para guardar borrador */}
      <GuardarBorradorDialog
        open={showBorradorDialog}
        onOpenChange={setShowBorradorDialog}
        datosComprobante={formData}
        tipoComprobante={formData.tipoECF}
        montoTotal={formData.montoTotal}
        cantidadItems={formData.detalles.length}
        onGuardado={() => {
          setShowBorradorDialog(false)
          toast({
            title: "Borrador guardado",
            description: "El borrador ha sido guardado exitosamente",
          })
        }}
      />
    </div>
  )
}
