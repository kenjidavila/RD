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
import { Save, X, RefreshCw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Item {
  id?: string
  codigo: string
  codigoBarras?: string
  descripcion: string
  descripcionCorta?: string
  tipoItem: string
  categoria: string
  subcategoria?: string
  marca?: string
  modelo?: string
  unidadMedida: string
  peso?: number
  volumen?: number
  precioCompra: number
  precioVenta: number
  precioVenta2?: number
  precioVenta3?: number
  precioMinimo?: number
  tasaItbis: string
  exentoItbis: boolean
  codigoImpuestoAdicional?: string
  tasaImpuestoAdicional: number
  aplicaIsc: boolean
  gradosAlcohol?: number
  cantidadReferencia?: number
  subcantidad?: number
  precioUnitarioReferencia?: number
  manejaInventario: boolean
  stockActual: number
  stockMinimo: number
  stockMaximo: number
  activo: boolean
  esFavorito: boolean
  notas?: string
}

interface ItemFormProps {
  item?: Item | null
  onClose: () => void
}

export default function ItemForm({ item, onClose }: ItemFormProps) {
  const [formData, setFormData] = useState<Item>({
    codigo: "",
    codigoBarras: "",
    descripcion: "",
    descripcionCorta: "",
    tipoItem: "bien",
    categoria: "General",
    subcategoria: "",
    marca: "",
    modelo: "",
    unidadMedida: "UND",
    peso: 0,
    volumen: 0,
    precioCompra: 0,
    precioVenta: 0,
    precioVenta2: 0,
    precioVenta3: 0,
    precioMinimo: 0,
    tasaItbis: "18",
    exentoItbis: false,
    codigoImpuestoAdicional: "",
    tasaImpuestoAdicional: 0,
    aplicaIsc: false,
    gradosAlcohol: 0,
    cantidadReferencia: 0,
    subcantidad: 0,
    precioUnitarioReferencia: 0,
    manejaInventario: false,
    stockActual: 0,
    stockMinimo: 0,
    stockMaximo: 0,
    activo: true,
    esFavorito: false,
    notas: "",
  })

  const [errors, setErrors] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [generatingCode, setGeneratingCode] = useState(false)

  const categorias = [
    "General",
    "Productos",
    "Servicios",
    "Electrónicos",
    "Accesorios",
    "Medicamentos",
    "Alimentos",
    "Bebidas",
    "Ropa",
    "Hogar",
    "Oficina",
    "Automotriz",
  ]

  const unidadesMedida = [
    "UND", // Unidad
    "KG", // Kilogramo
    "LB", // Libra
    "LT", // Litro
    "GL", // Galón
    "MT", // Metro
    "M2", // Metro cuadrado
    "M3", // Metro cúbico
    "CJ", // Caja
    "PQ", // Paquete
    "DOC", // Docena
    "PAR", // Par
    "HR", // Hora
  ]

  useEffect(() => {
    if (item) {
      setFormData(item)
    } else {
      // Generar código automático para nuevo item
      generateCode()
    }
  }, [item])

  const generateCode = async () => {
    setGeneratingCode(true)
    try {
      // Simular generación de código
      await new Promise((resolve) => setTimeout(resolve, 500))
      const timestamp = Date.now().toString().slice(-6)
      const newCode = formData.tipoItem === "bien" ? `ITM${timestamp}` : `SRV${timestamp}`
      setFormData((prev) => ({ ...prev, codigo: newCode }))
    } finally {
      setGeneratingCode(false)
    }
  }

  const handleInputChange = (field: keyof Item, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    // Auto-generar descripción corta si no existe
    if (field === "descripcion" && !formData.descripcionCorta) {
      const shortDesc = value.length > 50 ? value.substring(0, 50) + "..." : value
      setFormData((prev) => ({ ...prev, descripcionCorta: shortDesc }))
    }

    // Cambiar código automáticamente si cambia el tipo
    if (field === "tipoItem" && !item) {
      const timestamp = Date.now().toString().slice(-6)
      const newCode = value === "bien" ? `ITM${timestamp}` : `SRV${timestamp}`
      setFormData((prev) => ({ ...prev, codigo: newCode }))
    }
  }

  const validateForm = (): string[] => {
    const newErrors: string[] = []

    if (!formData.codigo.trim()) newErrors.push("Código es requerido")
    if (!formData.descripcion.trim()) newErrors.push("Descripción es requerida")
    if (formData.precioVenta <= 0) newErrors.push("Precio de venta debe ser mayor a 0")
    if (formData.precioMinimo && formData.precioMinimo > formData.precioVenta) {
      newErrors.push("Precio mínimo no puede ser mayor al precio de venta")
    }
    if (formData.tasaImpuestoAdicional < 0 || formData.tasaImpuestoAdicional > 100) {
      newErrors.push("Tasa de impuesto adicional debe estar entre 0 y 100")
    }
    if (formData.manejaInventario && formData.stockMinimo < 0) {
      newErrors.push("Stock mínimo no puede ser negativo")
    }
    if (formData.aplicaIsc && (!formData.gradosAlcohol || formData.gradosAlcohol <= 0)) {
      newErrors.push("Grados de alcohol son requeridos para ISC")
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
        id: item?.id,
        codigo: formData.codigo,
        codigo_barras: formData.codigoBarras,
        descripcion: formData.descripcion,
        descripcion_corta: formData.descripcionCorta,
        tipo_item: formData.tipoItem,
        categoria: formData.categoria,
        precio_venta: formData.precioVenta,
        unidad_medida: formData.unidadMedida,
        tasa_itbis: formData.tasaItbis,
        exento_itbis: formData.exentoItbis,
        maneja_inventario: formData.manejaInventario,
        stock_actual: formData.stockActual,
        stock_minimo: formData.stockMinimo,
        stock_maximo: formData.stockMaximo,
        activo: formData.activo,
        es_favorito: formData.esFavorito,
        notas: formData.notas,
      }

      const response = await fetch("/api/items", {
        method: item ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (data.success) {
        alert(item ? "Item actualizado exitosamente" : "Item creado exitosamente")
        onClose()
      } else {
        setErrors(data.errors || [data.error || "Error al guardar el item"])
      }
    } catch (error) {
      setErrors(["Error al guardar el item"])
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{item ? "Editar Item" : "Nuevo Item"}</CardTitle>
        <CardDescription>Complete la información del producto o servicio</CardDescription>
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
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="precios">Precios</TabsTrigger>
              <TabsTrigger value="impuestos">Impuestos</TabsTrigger>
              <TabsTrigger value="inventario">Inventario</TabsTrigger>
              <TabsTrigger value="adicional">Adicional</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigo">Código *</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="codigo"
                      value={formData.codigo}
                      onChange={(e) => handleInputChange("codigo", e.target.value)}
                      placeholder="Código del item"
                    />
                    {!item && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={generateCode}
                        disabled={generatingCode}
                        className="px-3 bg-transparent"
                      >
                        <RefreshCw className={`h-4 w-4 ${generatingCode ? "animate-spin" : ""}`} />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="codigo-barras">Código de Barras</Label>
                  <Input
                    id="codigo-barras"
                    value={formData.codigoBarras}
                    onChange={(e) => handleInputChange("codigoBarras", e.target.value)}
                    placeholder="Código de barras"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo-item">Tipo de Item *</Label>
                  <Select value={formData.tipoItem} onValueChange={(value) => handleInputChange("tipoItem", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bien">Bien</SelectItem>
                      <SelectItem value="servicio">Servicio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoría *</Label>
                  <Select value={formData.categoria} onValueChange={(value) => handleInputChange("categoria", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((categoria) => (
                        <SelectItem key={categoria} value={categoria}>
                          {categoria}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subcategoria">Subcategoría</Label>
                  <Input
                    id="subcategoria"
                    value={formData.subcategoria}
                    onChange={(e) => handleInputChange("subcategoria", e.target.value)}
                    placeholder="Subcategoría"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="marca">Marca</Label>
                  <Input
                    id="marca"
                    value={formData.marca}
                    onChange={(e) => handleInputChange("marca", e.target.value)}
                    placeholder="Marca del producto"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="modelo">Modelo</Label>
                  <Input
                    id="modelo"
                    value={formData.modelo}
                    onChange={(e) => handleInputChange("modelo", e.target.value)}
                    placeholder="Modelo del producto"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unidad-medida">Unidad de Medida</Label>
                  <Select
                    value={formData.unidadMedida}
                    onValueChange={(value) => handleInputChange("unidadMedida", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {unidadesMedida.map((unidad) => (
                        <SelectItem key={unidad} value={unidad}>
                          {unidad}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción *</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => handleInputChange("descripcion", e.target.value)}
                  placeholder="Descripción completa del item"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion-corta">Descripción Corta</Label>
                <Input
                  id="descripcion-corta"
                  value={formData.descripcionCorta}
                  onChange={(e) => handleInputChange("descripcionCorta", e.target.value)}
                  placeholder="Descripción corta para reportes"
                />
              </div>

              {formData.tipoItem === "bien" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="peso">Peso (kg)</Label>
                    <Input
                      id="peso"
                      type="number"
                      min="0"
                      step="0.001"
                      value={formData.peso}
                      onChange={(e) => handleInputChange("peso", Number.parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="volumen">Volumen (m³)</Label>
                    <Input
                      id="volumen"
                      type="number"
                      min="0"
                      step="0.001"
                      value={formData.volumen}
                      onChange={(e) => handleInputChange("volumen", Number.parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="precios" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="precio-compra">Precio de Compra (RD$)</Label>
                  <Input
                    id="precio-compra"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.precioCompra}
                    onChange={(e) => handleInputChange("precioCompra", Number.parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="precio-venta">Precio de Venta (RD$) *</Label>
                  <Input
                    id="precio-venta"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.precioVenta}
                    onChange={(e) => handleInputChange("precioVenta", Number.parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="precio-venta-2">Precio de Venta 2 (RD$)</Label>
                  <Input
                    id="precio-venta-2"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.precioVenta2}
                    onChange={(e) => handleInputChange("precioVenta2", Number.parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="precio-venta-3">Precio de Venta 3 (RD$)</Label>
                  <Input
                    id="precio-venta-3"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.precioVenta3}
                    onChange={(e) => handleInputChange("precioVenta3", Number.parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="precio-minimo">Precio Mínimo (RD$)</Label>
                  <Input
                    id="precio-minimo"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.precioMinimo}
                    onChange={(e) => handleInputChange("precioMinimo", Number.parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              {formData.precioCompra > 0 && formData.precioVenta > 0 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Análisis de Rentabilidad</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-blue-600">Margen:</span>
                      <div className="font-medium">RD$ {(formData.precioVenta - formData.precioCompra).toFixed(2)}</div>
                    </div>
                    <div>
                      <span className="text-blue-600">% Margen:</span>
                      <div className="font-medium">
                        {(((formData.precioVenta - formData.precioCompra) / formData.precioCompra) * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <span className="text-blue-600">% Markup:</span>
                      <div className="font-medium">
                        {(((formData.precioVenta - formData.precioCompra) / formData.precioVenta) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="impuestos" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tasa-itbis">Tasa ITBIS</Label>
                  <Select value={formData.tasaItbis} onValueChange={(value) => handleInputChange("tasaItbis", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="18">18%</SelectItem>
                      <SelectItem value="16">16%</SelectItem>
                      <SelectItem value="0">0%</SelectItem>
                      <SelectItem value="E">Exento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="codigo-impuesto-adicional">Código Impuesto Adicional</Label>
                  <Input
                    id="codigo-impuesto-adicional"
                    value={formData.codigoImpuestoAdicional}
                    onChange={(e) => handleInputChange("codigoImpuestoAdicional", e.target.value)}
                    placeholder="Código de impuesto adicional"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tasa-impuesto-adicional">Tasa Impuesto Adicional (%)</Label>
                  <Input
                    id="tasa-impuesto-adicional"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.tasaImpuestoAdicional}
                    onChange={(e) => handleInputChange("tasaImpuestoAdicional", Number.parseFloat(e.target.value) || 0)}
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
                    id="aplica-isc"
                    checked={formData.aplicaIsc}
                    onCheckedChange={(checked) => handleInputChange("aplicaIsc", checked)}
                  />
                  <Label htmlFor="aplica-isc">Aplica ISC (Impuesto Selectivo al Consumo)</Label>
                </div>
              </div>

              {formData.aplicaIsc && (
                <div className="p-4 border rounded-lg space-y-4">
                  <h4 className="font-medium">Configuración ISC</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="grados-alcohol">Grados de Alcohol</Label>
                      <Input
                        id="grados-alcohol"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.gradosAlcohol}
                        onChange={(e) => handleInputChange("gradosAlcohol", Number.parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cantidad-referencia">Cantidad de Referencia</Label>
                      <Input
                        id="cantidad-referencia"
                        type="number"
                        min="0"
                        step="0.001"
                        value={formData.cantidadReferencia}
                        onChange={(e) =>
                          handleInputChange("cantidadReferencia", Number.parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subcantidad">Subcantidad</Label>
                      <Input
                        id="subcantidad"
                        type="number"
                        min="0"
                        step="0.001"
                        value={formData.subcantidad}
                        onChange={(e) => handleInputChange("subcantidad", Number.parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="precio-unitario-referencia">Precio Unitario de Referencia</Label>
                      <Input
                        id="precio-unitario-referencia"
                        type="number"
                        min="0"
                        step="0.0001"
                        value={formData.precioUnitarioReferencia}
                        onChange={(e) =>
                          handleInputChange("precioUnitarioReferencia", Number.parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="inventario" className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <Switch
                  id="maneja-inventario"
                  checked={formData.manejaInventario}
                  onCheckedChange={(checked) => handleInputChange("manejaInventario", checked)}
                />
                <Label htmlFor="maneja-inventario">Maneja Inventario</Label>
              </div>

              {formData.manejaInventario && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stock-actual">Stock Actual</Label>
                    <Input
                      id="stock-actual"
                      type="number"
                      min="0"
                      step="0.001"
                      value={formData.stockActual}
                      onChange={(e) => handleInputChange("stockActual", Number.parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stock-minimo">Stock Mínimo</Label>
                    <Input
                      id="stock-minimo"
                      type="number"
                      min="0"
                      step="0.001"
                      value={formData.stockMinimo}
                      onChange={(e) => handleInputChange("stockMinimo", Number.parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stock-maximo">Stock Máximo</Label>
                    <Input
                      id="stock-maximo"
                      type="number"
                      min="0"
                      step="0.001"
                      value={formData.stockMaximo}
                      onChange={(e) => handleInputChange("stockMaximo", Number.parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              )}

              {formData.manejaInventario &&
                formData.stockActual <= formData.stockMinimo &&
                formData.stockMinimo > 0 && (
                  <Alert>
                    <AlertDescription>
                      ⚠️ El stock actual está por debajo del mínimo establecido. Considere reabastecer este item.
                    </AlertDescription>
                  </Alert>
                )}
            </TabsContent>

            <TabsContent value="adicional" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="activo"
                    checked={formData.activo}
                    onCheckedChange={(checked) => handleInputChange("activo", checked)}
                  />
                  <Label htmlFor="activo">Item Activo</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="es-favorito"
                    checked={formData.esFavorito}
                    onCheckedChange={(checked) => handleInputChange("esFavorito", checked)}
                  />
                  <Label htmlFor="es-favorito">Marcar como Favorito</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notas">Notas</Label>
                <Textarea
                  id="notas"
                  value={formData.notas}
                  onChange={(e) => handleInputChange("notas", e.target.value)}
                  placeholder="Notas adicionales sobre el item"
                  rows={4}
                />
              </div>
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
