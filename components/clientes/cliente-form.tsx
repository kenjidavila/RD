"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Save, X, Plus, Trash2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Cliente {
  id?: string
  rncCedula: string
  tipoDocumento: string
  razonSocial: string
  nombreComercial?: string
  telefono?: string
  email?: string
  direccion?: string
  provincia?: string
  municipio?: string
  pais?: string
  tipoCliente: string
  limiteCredito: number
  diasCredito: number
  descuentoGeneral: number
  exentoItbis: boolean
  retencionItbis: boolean
  retencionIsr: boolean
  activo: boolean
  notas?: string
  contactos?: Contacto[]
  direcciones?: Direccion[]
}

interface Contacto {
  id?: string
  nombre: string
  cargo: string
  telefono: string
  email: string
  esPrincipal: boolean
}

interface Direccion {
  id?: string
  tipoDireccion: string
  direccion: string
  provincia: string
  municipio: string
  codigoPostal: string
  esPrincipal: boolean
}

interface ClienteFormProps {
  cliente?: Cliente | null
  onClose: () => void
}

export default function ClienteForm({ cliente, onClose }: ClienteFormProps) {
  const [formData, setFormData] = useState<Cliente>({
    rncCedula: "",
    tipoDocumento: "RNC",
    razonSocial: "",
    nombreComercial: "",
    telefono: "",
    email: "",
    direccion: "",
    provincia: "",
    municipio: "",
    pais: "República Dominicana",
    tipoCliente: "regular",
    limiteCredito: 0,
    diasCredito: 0,
    descuentoGeneral: 0,
    exentoItbis: false,
    retencionItbis: false,
    retencionIsr: false,
    activo: true,
    notas: "",
  })

  const [contactos, setContactos] = useState<Contacto[]>([])
  const [direcciones, setDirecciones] = useState<Direccion[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const provincias = [
    "Distrito Nacional",
    "Santiago",
    "La Vega",
    "San Cristóbal",
    "Puerto Plata",
    "San Pedro de Macorís",
    "La Romana",
    "Barahona",
    "Azua",
    "Baní",
    "Moca",
    "San Francisco de Macorís",
  ]

  useEffect(() => {
    if (cliente) {
      setFormData(cliente)
      if (cliente.contactos) {
        setContactos(cliente.contactos)
      }
      if (cliente.direcciones) {
        setDirecciones(cliente.direcciones)
      }
    }
  }, [cliente])

  const handleInputChange = (field: keyof Cliente, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const validateForm = (): string[] => {
    const newErrors: string[] = []

    if (!formData.rncCedula.trim()) newErrors.push("RNC/Cédula es requerido")
    if (!formData.razonSocial.trim()) newErrors.push("Razón Social es requerida")
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.push("Email no tiene formato válido")
    }
    if (formData.limiteCredito < 0) newErrors.push("Límite de crédito no puede ser negativo")
    if (formData.diasCredito < 0) newErrors.push("Días de crédito no puede ser negativo")
    if (formData.descuentoGeneral < 0 || formData.descuentoGeneral > 100) {
      newErrors.push("Descuento general debe estar entre 0 y 100")
    }

    return newErrors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErrors([])

    const validationErrors = validateForm()
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      setSaving(false)
      return
    }

    try {
      const payload = {
        id: cliente?.id,
        tipo_cliente: formData.tipoCliente,
        rnc_cedula: formData.rncCedula,
        razon_social: formData.razonSocial,
        nombre_comercial: formData.nombreComercial,
        telefono: formData.telefono,
        email: formData.email,
        direccion: formData.direccion,
        provincia: formData.provincia,
        municipio: formData.municipio,
        pais: formData.pais,
        activo: formData.activo,
        contactos,
        direcciones,
      }

      const response = await fetch("/api/clientes", {
        method: cliente ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || "Error al guardar el cliente")
      }

      alert(cliente ? "Cliente actualizado exitosamente" : "Cliente creado exitosamente")
      onClose()
    } catch (error: any) {
      setErrors([error.message || "Error al guardar el cliente"]) 
    } finally {
      setSaving(false)
    }
  }

  const addContacto = () => {
    setContactos([
      ...contactos,
      {
        nombre: "",
        cargo: "",
        telefono: "",
        email: "",
        esPrincipal: contactos.length === 0,
      },
    ])
  }

  const removeContacto = (index: number) => {
    setContactos(contactos.filter((_, i) => i !== index))
  }

  const updateContacto = (index: number, field: keyof Contacto, value: any) => {
    const updated = [...contactos]
    updated[index] = { ...updated[index], [field]: value }
    setContactos(updated)
  }

  const addDireccion = () => {
    setDirecciones([
      ...direcciones,
      {
        tipoDireccion: "facturacion",
        direccion: "",
        provincia: "",
        municipio: "",
        codigoPostal: "",
        esPrincipal: direcciones.length === 0,
      },
    ])
  }

  const removeDireccion = (index: number) => {
    setDirecciones(direcciones.filter((_, i) => i !== index))
  }

  const updateDireccion = (index: number, field: keyof Direccion, value: any) => {
    const updated = [...direcciones]
    updated[index] = { ...updated[index], [field]: value }
    setDirecciones(updated)
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{cliente ? "Editar Cliente" : "Nuevo Cliente"}</CardTitle>
        <CardDescription>Complete la información del cliente</CardDescription>
      </CardHeader>
      <CardContent>
        {errors.length > 0 && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>
              <ul className="list-disc list-inside">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="fiscal">Fiscal</TabsTrigger>
              <TabsTrigger value="contactos">Contactos</TabsTrigger>
              <TabsTrigger value="direcciones">Direcciones</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo-documento">Tipo de Documento *</Label>
                  <Select
                    value={formData.tipoDocumento}
                    onValueChange={(value) => handleInputChange("tipoDocumento", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RNC">RNC</SelectItem>
                      <SelectItem value="CEDULA">Cédula</SelectItem>
                      <SelectItem value="PASAPORTE">Pasaporte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rnc-cedula">RNC/Cédula *</Label>
                  <Input
                    id="rnc-cedula"
                    value={formData.rncCedula}
                    onChange={(e) => handleInputChange("rncCedula", e.target.value)}
                    placeholder="Ingrese RNC o Cédula"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="razon-social">Razón Social *</Label>
                  <Input
                    id="razon-social"
                    value={formData.razonSocial}
                    onChange={(e) => handleInputChange("razonSocial", e.target.value)}
                    placeholder="Nombre o razón social"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nombre-comercial">Nombre Comercial</Label>
                  <Input
                    id="nombre-comercial"
                    value={formData.nombreComercial}
                    onChange={(e) => handleInputChange("nombreComercial", e.target.value)}
                    placeholder="Nombre comercial"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    value={formData.telefono}
                    onChange={(e) => handleInputChange("telefono", e.target.value)}
                    placeholder="809-123-4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="cliente@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo-cliente">Tipo de Cliente</Label>
                  <Select
                    value={formData.tipoCliente}
                    onValueChange={(value) => handleInputChange("tipoCliente", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="vip">VIP</SelectItem>
                      <SelectItem value="corporativo">Corporativo</SelectItem>
                      <SelectItem value="gobierno">Gobierno</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="provincia">Provincia</Label>
                  <Select value={formData.provincia} onValueChange={(value) => handleInputChange("provincia", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione provincia" />
                    </SelectTrigger>
                    <SelectContent>
                      {provincias.map((provincia) => (
                        <SelectItem key={provincia} value={provincia}>
                          {provincia}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="municipio">Municipio</Label>
                  <Input
                    id="municipio"
                    value={formData.municipio}
                    onChange={(e) => handleInputChange("municipio", e.target.value)}
                    placeholder="Municipio"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Textarea
                  id="direccion"
                  value={formData.direccion}
                  onChange={(e) => handleInputChange("direccion", e.target.value)}
                  placeholder="Dirección completa"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notas">Notas</Label>
                <Textarea
                  id="notas"
                  value={formData.notas}
                  onChange={(e) => handleInputChange("notas", e.target.value)}
                  placeholder="Notas adicionales"
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="fiscal" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="limite-credito">Límite de Crédito (RD$)</Label>
                  <Input
                    id="limite-credito"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.limiteCredito}
                    onChange={(e) => handleInputChange("limiteCredito", Number.parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dias-credito">Días de Crédito</Label>
                  <Input
                    id="dias-credito"
                    type="number"
                    min="0"
                    value={formData.diasCredito}
                    onChange={(e) => handleInputChange("diasCredito", Number.parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descuento-general">Descuento General (%)</Label>
                  <Input
                    id="descuento-general"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.descuentoGeneral}
                    onChange={(e) => handleInputChange("descuentoGeneral", Number.parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="exento-itbis"
                    checked={formData.exentoItbis}
                    onCheckedChange={(checked) => handleInputChange("exentoItbis", checked)}
                  />
                  <Label htmlFor="exento-itbis">Exento de ITBIS</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="retencion-itbis"
                    checked={formData.retencionItbis}
                    onCheckedChange={(checked) => handleInputChange("retencionItbis", checked)}
                  />
                  <Label htmlFor="retencion-itbis">Aplica Retención ITBIS</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="retencion-isr"
                    checked={formData.retencionIsr}
                    onCheckedChange={(checked) => handleInputChange("retencionIsr", checked)}
                  />
                  <Label htmlFor="retencion-isr">Aplica Retención ISR</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="activo"
                    checked={formData.activo}
                    onCheckedChange={(checked) => handleInputChange("activo", checked)}
                  />
                  <Label htmlFor="activo">Cliente Activo</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="contactos" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Contactos Adicionales</h3>
                <Button type="button" onClick={addContacto} variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Contacto
                </Button>
              </div>

              {contactos.map((contacto, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Contacto {index + 1}</h4>
                    <Button type="button" onClick={() => removeContacto(index)} variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nombre</Label>
                      <Input
                        value={contacto.nombre}
                        onChange={(e) => updateContacto(index, "nombre", e.target.value)}
                        placeholder="Nombre del contacto"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Cargo</Label>
                      <Input
                        value={contacto.cargo}
                        onChange={(e) => updateContacto(index, "cargo", e.target.value)}
                        placeholder="Cargo o posición"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Teléfono</Label>
                      <Input
                        value={contacto.telefono}
                        onChange={(e) => updateContacto(index, "telefono", e.target.value)}
                        placeholder="Teléfono"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={contacto.email}
                        onChange={(e) => updateContacto(index, "email", e.target.value)}
                        placeholder="Email"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={contacto.esPrincipal}
                      onCheckedChange={(checked) => updateContacto(index, "esPrincipal", checked)}
                    />
                    <Label>Contacto Principal</Label>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="direcciones" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Direcciones Adicionales</h3>
                <Button type="button" onClick={addDireccion} variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Dirección
                </Button>
              </div>

              {direcciones.map((direccion, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Dirección {index + 1}</h4>
                    <Button type="button" onClick={() => removeDireccion(index)} variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo de Dirección</Label>
                      <Select
                        value={direccion.tipoDireccion}
                        onValueChange={(value) => updateDireccion(index, "tipoDireccion", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="facturacion">Facturación</SelectItem>
                          <SelectItem value="entrega">Entrega</SelectItem>
                          <SelectItem value="correspondencia">Correspondencia</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Código Postal</Label>
                      <Input
                        value={direccion.codigoPostal}
                        onChange={(e) => updateDireccion(index, "codigoPostal", e.target.value)}
                        placeholder="Código postal"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Provincia</Label>
                      <Select
                        value={direccion.provincia}
                        onValueChange={(value) => updateDireccion(index, "provincia", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione provincia" />
                        </SelectTrigger>
                        <SelectContent>
                          {provincias.map((provincia) => (
                            <SelectItem key={provincia} value={provincia}>
                              {provincia}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Municipio</Label>
                      <Input
                        value={direccion.municipio}
                        onChange={(e) => updateDireccion(index, "municipio", e.target.value)}
                        placeholder="Municipio"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Dirección</Label>
                    <Textarea
                      value={direccion.direccion}
                      onChange={(e) => updateDireccion(index, "direccion", e.target.value)}
                      placeholder="Dirección completa"
                      rows={2}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={direccion.esPrincipal}
                      onCheckedChange={(checked) => updateDireccion(index, "esPrincipal", checked)}
                    />
                    <Label>Dirección Principal</Label>
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-4 mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
