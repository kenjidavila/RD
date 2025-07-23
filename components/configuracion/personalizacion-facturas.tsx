"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Palette, Eye, Save, FileText, Settings, Droplets } from "lucide-react"
import { useConfiguracionTabs } from "./configuracion-tabs-context"

interface PersonalizacionConfig {
  // Configuración básica
  mostrar_logo: boolean
  color_primario: string
  color_secundario: string
  pie_pagina: string
  terminos_condiciones: string

  // Configuración de papel
  papel_tamaño: "A4" | "Letter" | "Legal" | "A5" | "Custom"
  papel_orientacion: "portrait" | "landscape"
  papel_margenes_superior: number
  papel_margenes_inferior: number
  papel_margenes_izquierdo: number
  papel_margenes_derecho: number
  papel_customSize_ancho?: number
  papel_customSize_alto?: number

  // Marca de agua
  marca_agua_habilitada: boolean
  marca_agua_texto: string
  marca_agua_opacidad: number
  marca_agua_posicion: "centro" | "diagonal" | "esquina-superior" | "esquina-inferior"
  marca_agua_tamaño: "pequeño" | "mediano" | "grande"

  // Fuentes
  fuentes_encabezado: string
  fuentes_cuerpo: string
  fuentes_numeros: string
  fuentes_tamaño_titulo: number
  fuentes_tamaño_subtitulo: number
  fuentes_tamaño_texto: number
  fuentes_tamaño_pequeño: number

  // Layout
  layout_logoTamaño: "pequeño" | "mediano" | "grande"
  layout_mostrarLineasSeparadoras: boolean
  layout_espaciadoLineas: "compacto" | "normal" | "amplio"
  layout_mostrarBordes: boolean
  layout_estiloBordes: "simple" | "doble" | "punteado"
}

export default function PersonalizacionFacturas() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const { reportError, reportSuccess } = useConfiguracionTabs()

  const [formData, setFormData] = useState<PersonalizacionConfig>({
    mostrar_logo: true,
    color_primario: "#3B82F6",
    color_secundario: "#1E40AF",
    pie_pagina: "",
    terminos_condiciones: "",
    papel_tamaño: "A4",
    papel_orientacion: "portrait",
    papel_margenes_superior: 20,
    papel_margenes_inferior: 20,
    papel_margenes_izquierdo: 20,
    papel_margenes_derecho: 20,
    papel_customSize_ancho: 210,
    papel_customSize_alto: 297,
    marca_agua_habilitada: false,
    marca_agua_texto: "COPIA",
    marca_agua_opacidad: 30,
    marca_agua_posicion: "diagonal",
    marca_agua_tamaño: "mediano",
    fuentes_encabezado: "helvetica",
    fuentes_cuerpo: "helvetica",
    fuentes_numeros: "helvetica",
    fuentes_tamaño_titulo: 18,
    fuentes_tamaño_subtitulo: 14,
    fuentes_tamaño_texto: 12,
    fuentes_tamaño_pequeño: 10,
    layout_logoTamaño: "mediano",
    layout_mostrarLineasSeparadoras: true,
    layout_espaciadoLineas: "normal",
    layout_mostrarBordes: true,
    layout_estiloBordes: "simple",
  })

  useEffect(() => {
    const draft = localStorage.getItem("personalizacion_facturas_draft")
    if (draft) {
      try {
        setFormData(JSON.parse(draft))
      } catch {
        /* ignore */
      }
    }
    fetchConfiguracion()
  }, [])

  useEffect(() => {
    localStorage.setItem(
      "personalizacion_facturas_draft",
      JSON.stringify(formData),
    )
  }, [formData])

  const fetchConfiguracion = async () => {
    try {
      const response = await fetch("/api/configuracion?tipo=personalizacion_facturas")

      if (response.status === 401) {
        toast({
          title: "Sesión requerida",
          description: "Debe iniciar sesión para configurar las facturas",
          variant: "destructive",
        })
        router.push("/perfil-empresa")
        return
      }

      if (response.status === 404) {
        toast({
          title: "Sin configuración",
          description: "No se encontró configuración previa, se creará una nueva",
        })
      }

      const result = await response.json()

      if (result.data?.personalizacion_facturas) {
        const config = result.data.personalizacion_facturas
        setFormData({
          mostrar_logo: config.mostrar_logo ?? true,
          color_primario: config.color_primario ?? "#3B82F6",
          color_secundario: config.color_secundario ?? "#1E40AF",
          pie_pagina: config.pie_pagina ?? "",
          terminos_condiciones: config.terminos_condiciones ?? "",
          papel_tamaño: config.papel_tamaño ?? "A4",
          papel_orientacion: config.papel_orientacion ?? "portrait",
          papel_margenes_superior: config.papel_margenes_superior ?? 20,
          papel_margenes_inferior: config.papel_margenes_inferior ?? 20,
          papel_margenes_izquierdo: config.papel_margenes_izquierdo ?? 20,
          papel_margenes_derecho: config.papel_margenes_derecho ?? 20,
          papel_customSize_ancho: config.papel_customSize_ancho ?? 210,
          papel_customSize_alto: config.papel_customSize_alto ?? 297,
          marca_agua_habilitada: config.marca_agua_habilitada ?? false,
          marca_agua_texto: config.marca_agua_texto ?? "COPIA",
          marca_agua_opacidad: config.marca_agua_opacidad ?? 30,
          marca_agua_posicion: config.marca_agua_posicion ?? "diagonal",
          marca_agua_tamaño: config.marca_agua_tamaño ?? "mediano",
          fuentes_encabezado: config.fuentes_encabezado ?? "helvetica",
          fuentes_cuerpo: config.fuentes_cuerpo ?? "helvetica",
          fuentes_numeros: config.fuentes_numeros ?? "helvetica",
          fuentes_tamaño_titulo: config.fuentes_tamaño_titulo ?? 18,
          fuentes_tamaño_subtitulo: config.fuentes_tamaño_subtitulo ?? 14,
          fuentes_tamaño_texto: config.fuentes_tamaño_texto ?? 12,
          fuentes_tamaño_pequeño: config.fuentes_tamaño_pequeño ?? 10,
          layout_logoTamaño: config.layout_logoTamaño ?? "mediano",
          layout_mostrarLineasSeparadoras: config.layout_mostrarLineasSeparadoras ?? true,
          layout_espaciadoLineas: config.layout_espaciadoLineas ?? "normal",
          layout_mostrarBordes: config.layout_mostrarBordes ?? true,
          layout_estiloBordes: config.layout_estiloBordes ?? "simple",
        })
      }
    } catch (error) {
      console.error("Error fetching configuracion:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo cargar la configuración de facturas",
        variant: "destructive",
      })
      reportError("personalizacion")
    } finally {
      setLoading(false)
    }
  }

const handleInputChange = (field: keyof PersonalizacionConfig, value: any) => {
  setFormData((prev) => ({
    ...prev,
    [field]: value,
  }))
}

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!['image/png', 'image/jpeg', 'image/svg+xml'].includes(file.type)) {
      toast({
        title: 'Tipo de archivo no soportado',
        description: 'Solo se permiten imágenes PNG, JPG o SVG',
        variant: 'destructive',
      })
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'Archivo muy grande',
        description: 'El logo no debe exceder 2MB',
        variant: 'destructive',
      })
      return
    }
    setLogoPreview(URL.createObjectURL(file))
  }

  const validateFormData = (): string | null => {
    const hexColor = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
    if (!formData.color_primario || !formData.color_secundario) {
      return "Debe definir los colores primario y secundario"
    }
    if (!hexColor.test(formData.color_primario) || !hexColor.test(formData.color_secundario)) {
      return "Los colores primario y secundario deben ser códigos hexadecimales válidos"
    }
    if (!formData.fuentes_encabezado || !formData.fuentes_cuerpo || !formData.fuentes_numeros) {
      return "Debe seleccionar las fuentes a utilizar"
    }
    if (formData.marca_agua_habilitada && !formData.marca_agua_texto.trim()) {
      return "El texto de la marca de agua es obligatorio"
    }
    const numericFields = [
      formData.papel_margenes_superior,
      formData.papel_margenes_inferior,
      formData.papel_margenes_izquierdo,
      formData.papel_margenes_derecho,
      formData.fuentes_tamaño_titulo,
      formData.fuentes_tamaño_subtitulo,
      formData.fuentes_tamaño_texto,
      formData.fuentes_tamaño_pequeño,
    ]
    if (numericFields.some((n) => Number.isNaN(n) || n < 0)) {
      return "Existen valores numéricos inválidos en la configuración"
    }
    if (formData.marca_agua_texto.length > 50) {
      return "El texto de la marca de agua es muy largo"
    }
    if (
      formData.color_primario.toLowerCase() === "#ffffff" &&
      formData.color_secundario.toLowerCase() === "#ffffff"
    ) {
      return "Los colores no pueden ser ambos blancos"
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const validationError = validateFormData()
      if (validationError) {
        toast({ title: "Error", description: validationError, variant: "destructive" })
        reportError("personalizacion")
        return
      }

      const response = await fetch("/api/configuracion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tipo: "personalizacion_facturas",
          configuracion: formData,
        }),
      })
      if (response.status === 401) {
        toast({
          title: "Sesión requerida",
          description: "Debe iniciar sesión para guardar la configuración",
          variant: "destructive",
        })
        router.push("/perfil-empresa")
        reportError("personalizacion")
        return
      } else if (response.status === 404) {
        toast({
          title: "Empresa no encontrada",
          description: "Debe configurar su empresa antes de personalizar facturas",
          variant: "destructive",
        })
        router.push("/perfil-empresa")
        reportError("personalizacion")
        return
      }

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Error al guardar configuración")
      }

      toast({
        title: "Éxito",
        description: "Configuración de facturas guardada correctamente",
      })
      reportSuccess("personalizacion")

      await fetchConfiguracion()
    } catch (error) {
      console.error("Error saving configuracion:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo guardar la configuración",
        variant: "destructive",
      })
      reportError("personalizacion")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Cargando configuración de facturas...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Personalización de Facturas
          </CardTitle>
          <CardDescription>Configure la apariencia, formato y contenido de sus facturas electrónicas</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="basico" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basico">Básico</TabsTrigger>
                <TabsTrigger value="papel">Papel</TabsTrigger>
                <TabsTrigger value="marca-agua">Marca de Agua</TabsTrigger>
                <TabsTrigger value="avanzado">Avanzado</TabsTrigger>
              </TabsList>

              {/* Configuración Básica */}
              <TabsContent value="basico" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Configuración General
                  </h3>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="mostrar_logo"
                      checked={formData.mostrar_logo}
                      onCheckedChange={(checked) => handleInputChange("mostrar_logo", checked)}
                    />
                    <Label htmlFor="mostrar_logo">Mostrar logo de la empresa en las facturas</Label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="layout_logoTamaño">Tamaño del Logo</Label>
                      <Select
                        value={formData.layout_logoTamaño}
                        onValueChange={(value) => handleInputChange("layout_logoTamaño", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pequeño">Pequeño</SelectItem>
                          <SelectItem value="mediano">Mediano</SelectItem>
                          <SelectItem value="grande">Grande</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="logo_file">Logo</Label>
                      <Input
                        id="logo_file"
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml"
                        onChange={handleLogoChange}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Droplets className="h-4 w-4" />
                    Colores
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="color_primario">Color Primario</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="color_primario"
                          type="color"
                          value={formData.color_primario}
                          onChange={(e) => handleInputChange("color_primario", e.target.value)}
                          className="w-16 h-10 p-1 border rounded"
                        />
                        <Input
                          value={formData.color_primario}
                          onChange={(e) => handleInputChange("color_primario", e.target.value)}
                          placeholder="#3B82F6"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="color_secundario">Color Secundario</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="color_secundario"
                          type="color"
                          value={formData.color_secundario}
                          onChange={(e) => handleInputChange("color_secundario", e.target.value)}
                          className="w-16 h-10 p-1 border rounded"
                        />
                        <Input
                          value={formData.color_secundario}
                          onChange={(e) => handleInputChange("color_secundario", e.target.value)}
                          placeholder="#1E40AF"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Contenido Adicional</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="pie_pagina">Pie de Página</Label>
                      <Textarea
                        id="pie_pagina"
                        value={formData.pie_pagina}
                        onChange={(e) => handleInputChange("pie_pagina", e.target.value)}
                        placeholder="Texto que aparecerá en el pie de página de las facturas"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="terminos_condiciones">Términos y Condiciones</Label>
                      <Textarea
                        id="terminos_condiciones"
                        value={formData.terminos_condiciones}
                        onChange={(e) => handleInputChange("terminos_condiciones", e.target.value)}
                        placeholder="Términos y condiciones que aparecerán en las facturas"
                        rows={4}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Configuración de Papel */}
              <TabsContent value="papel" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Formato del Papel
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="papel_tamaño">Tamaño del Papel</Label>
                      <Select
                        value={formData.papel_tamaño}
                        onValueChange={(value) => handleInputChange("papel_tamaño", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A4">A4 (210 x 297 mm)</SelectItem>
                          <SelectItem value="Letter">Letter (216 x 279 mm)</SelectItem>
                          <SelectItem value="Legal">Legal (216 x 356 mm)</SelectItem>
                          <SelectItem value="A5">A5 (148 x 210 mm)</SelectItem>
                          <SelectItem value="Custom">Personalizado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="papel_orientacion">Orientación</Label>
                      <Select
                        value={formData.papel_orientacion}
                        onValueChange={(value) => handleInputChange("papel_orientacion", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="portrait">Vertical (Portrait)</SelectItem>
                          <SelectItem value="landscape">Horizontal (Landscape)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {formData.papel_tamaño === "Custom" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="papel_customSize_ancho">Ancho (mm)</Label>
                        <Input
                          id="papel_customSize_ancho"
                          type="number"
                          value={formData.papel_customSize_ancho}
                          onChange={(e) => handleInputChange("papel_customSize_ancho", Number(e.target.value))}
                          min="50"
                          max="500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="papel_customSize_alto">Alto (mm)</Label>
                        <Input
                          id="papel_customSize_alto"
                          type="number"
                          value={formData.papel_customSize_alto}
                          onChange={(e) => handleInputChange("papel_customSize_alto", Number(e.target.value))}
                          min="50"
                          max="500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Márgenes (mm)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="papel_margenes_superior">Superior</Label>
                      <Input
                        id="papel_margenes_superior"
                        type="number"
                        value={formData.papel_margenes_superior}
                        onChange={(e) => handleInputChange("papel_margenes_superior", Number(e.target.value))}
                        min="5"
                        max="50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="papel_margenes_inferior">Inferior</Label>
                      <Input
                        id="papel_margenes_inferior"
                        type="number"
                        value={formData.papel_margenes_inferior}
                        onChange={(e) => handleInputChange("papel_margenes_inferior", Number(e.target.value))}
                        min="5"
                        max="50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="papel_margenes_izquierdo">Izquierdo</Label>
                      <Input
                        id="papel_margenes_izquierdo"
                        type="number"
                        value={formData.papel_margenes_izquierdo}
                        onChange={(e) => handleInputChange("papel_margenes_izquierdo", Number(e.target.value))}
                        min="5"
                        max="50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="papel_margenes_derecho">Derecho</Label>
                      <Input
                        id="papel_margenes_derecho"
                        type="number"
                        value={formData.papel_margenes_derecho}
                        onChange={(e) => handleInputChange("papel_margenes_derecho", Number(e.target.value))}
                        min="5"
                        max="50"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Configuración de Marca de Agua */}
              <TabsContent value="marca-agua" className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="marca_agua_habilitada"
                      checked={formData.marca_agua_habilitada}
                      onCheckedChange={(checked) => handleInputChange("marca_agua_habilitada", checked)}
                    />
                    <Label htmlFor="marca_agua_habilitada">Habilitar marca de agua</Label>
                  </div>

                  {formData.marca_agua_habilitada && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="marca_agua_texto">Texto de la marca de agua</Label>
                        <Input
                          id="marca_agua_texto"
                          value={formData.marca_agua_texto}
                          onChange={(e) => handleInputChange("marca_agua_texto", e.target.value)}
                          placeholder="COPIA"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="marca_agua_opacidad">Opacidad (%)</Label>
                          <Input
                            id="marca_agua_opacidad"
                            type="number"
                            value={formData.marca_agua_opacidad}
                            onChange={(e) => handleInputChange("marca_agua_opacidad", Number(e.target.value))}
                            min="10"
                            max="80"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="marca_agua_posicion">Posición</Label>
                          <Select
                            value={formData.marca_agua_posicion}
                            onValueChange={(value) => handleInputChange("marca_agua_posicion", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="centro">Centro</SelectItem>
                              <SelectItem value="diagonal">Diagonal</SelectItem>
                              <SelectItem value="esquina-superior">Esquina Superior</SelectItem>
                              <SelectItem value="esquina-inferior">Esquina Inferior</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="marca_agua_tamaño">Tamaño</Label>
                          <Select
                            value={formData.marca_agua_tamaño}
                            onValueChange={(value) => handleInputChange("marca_agua_tamaño", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pequeño">Pequeño</SelectItem>
                              <SelectItem value="mediano">Mediano</SelectItem>
                              <SelectItem value="grande">Grande</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Configuración Avanzada */}
              <TabsContent value="avanzado" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Fuentes y Tamaños</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fuentes_tamaño_titulo">Título</Label>
                      <Input
                        id="fuentes_tamaño_titulo"
                        type="number"
                        value={formData.fuentes_tamaño_titulo}
                        onChange={(e) => handleInputChange("fuentes_tamaño_titulo", Number(e.target.value))}
                        min="12"
                        max="24"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fuentes_tamaño_subtitulo">Subtítulo</Label>
                      <Input
                        id="fuentes_tamaño_subtitulo"
                        type="number"
                        value={formData.fuentes_tamaño_subtitulo}
                        onChange={(e) => handleInputChange("fuentes_tamaño_subtitulo", Number(e.target.value))}
                        min="10"
                        max="20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fuentes_tamaño_texto">Texto</Label>
                      <Input
                        id="fuentes_tamaño_texto"
                        type="number"
                        value={formData.fuentes_tamaño_texto}
                        onChange={(e) => handleInputChange("fuentes_tamaño_texto", Number(e.target.value))}
                        min="8"
                        max="16"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fuentes_tamaño_pequeño">Pequeño</Label>
                      <Input
                        id="fuentes_tamaño_pequeño"
                        type="number"
                        value={formData.fuentes_tamaño_pequeño}
                        onChange={(e) => handleInputChange("fuentes_tamaño_pequeño", Number(e.target.value))}
                        min="6"
                        max="12"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Layout y Bordes</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="layout_mostrarLineasSeparadoras"
                        checked={formData.layout_mostrarLineasSeparadoras}
                        onCheckedChange={(checked) => handleInputChange("layout_mostrarLineasSeparadoras", checked)}
                      />
                      <Label htmlFor="layout_mostrarLineasSeparadoras">Mostrar líneas separadoras</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="layout_mostrarBordes"
                        checked={formData.layout_mostrarBordes}
                        onCheckedChange={(checked) => handleInputChange("layout_mostrarBordes", checked)}
                      />
                      <Label htmlFor="layout_mostrarBordes">Mostrar bordes en tablas</Label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="layout_espaciadoLineas">Espaciado de líneas</Label>
                      <Select
                        value={formData.layout_espaciadoLineas}
                        onValueChange={(value) => handleInputChange("layout_espaciadoLineas", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="compacto">Compacto</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="amplio">Amplio</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="layout_estiloBordes">Estilo de bordes</Label>
                      <Select
                        value={formData.layout_estiloBordes}
                        onValueChange={(value) => handleInputChange("layout_estiloBordes", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="simple">Simple</SelectItem>
                          <SelectItem value="doble">Doble</SelectItem>
                          <SelectItem value="punteado">Punteado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-between pt-6">
              <Button type="button" variant="outline" onClick={() => setShowPreview(!showPreview)}>
                <Eye className="mr-2 h-4 w-4" />
                {showPreview ? "Ocultar" : "Ver"} Vista Previa
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Guardar Configuración
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Vista Previa */}
      {showPreview && (
        <Card>
          <CardHeader>
            <CardTitle>Vista Previa de Factura</CardTitle>
            <CardDescription>
              Así se verán sus facturas con la configuración actual
              {formData.papel_tamaño === "Custom"
                ? ` (${formData.papel_customSize_ancho}x${formData.papel_customSize_alto}mm)`
                : ` (${formData.papel_tamaño}, ${formData.papel_orientacion})`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="border rounded-lg p-6 bg-white relative overflow-hidden"
              style={{
                fontFamily: "Arial, sans-serif",
                aspectRatio: formData.papel_orientacion === "landscape" ? "297/210" : "210/297",
                maxWidth: formData.papel_orientacion === "landscape" ? "600px" : "400px",
                margin: "0 auto",
              }}
            >
              {/* Marca de agua */}
              {formData.marca_agua_habilitada && (
                <div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  style={{
                    opacity: formData.marca_agua_opacidad / 100,
                    transform: formData.marca_agua_posicion === "diagonal" ? "rotate(-45deg)" : "none",
                    top:
                      formData.marca_agua_posicion === "esquina-superior"
                        ? "20px"
                        : formData.marca_agua_posicion === "esquina-inferior"
                          ? "auto"
                          : "50%",
                    bottom: formData.marca_agua_posicion === "esquina-inferior" ? "20px" : "auto",
                    right: formData.marca_agua_posicion.includes("esquina") ? "20px" : "auto",
                    left: formData.marca_agua_posicion.includes("esquina") ? "auto" : "50%",
                    transform:
                      formData.marca_agua_posicion === "diagonal"
                        ? "translate(-50%, -50%) rotate(-45deg)"
                        : formData.marca_agua_posicion === "centro"
                          ? "translate(-50%, -50%)"
                          : "none",
                  }}
                >
                  <span
                    className="font-bold text-gray-400"
                    style={{
                      fontSize:
                        formData.marca_agua_tamaño === "grande"
                          ? "48px"
                          : formData.marca_agua_tamaño === "mediano"
                            ? "32px"
                            : "24px",
                      color: formData.color_primario,
                    }}
                  >
                    {formData.marca_agua_texto}
                  </span>
                </div>
              )}

              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  {formData.mostrar_logo && (
                    logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="logo"
                        className="mb-2 object-contain"
                        style={{
                          width:
                            formData.layout_logoTamaño === "grande"
                              ? "120px"
                              : formData.layout_logoTamaño === "mediano"
                                ? "80px"
                                : "60px",
                          height:
                            formData.layout_logoTamaño === "grande"
                              ? "80px"
                              : formData.layout_logoTamaño === "mediano"
                                ? "60px"
                                : "40px",
                        }}
                      />
                    ) : (
                      <div
                        className="bg-gray-200 rounded mb-2 flex items-center justify-center text-xs text-gray-500"
                        style={{
                          width:
                            formData.layout_logoTamaño === "grande"
                              ? "120px"
                              : formData.layout_logoTamaño === "mediano"
                                ? "80px"
                                : "60px",
                          height:
                            formData.layout_logoTamaño === "grande"
                              ? "80px"
                              : formData.layout_logoTamaño === "mediano"
                                ? "60px"
                                : "40px",
                        }}
                      >
                        Logo
                      </div>
                    )
                  )}
                  <h1
                    className="font-bold"
                    style={{
                      color: formData.color_primario,
                      fontSize: `${formData.fuentes_tamaño_titulo}px`,
                    }}
                  >
                    FACTURA ELECTRÓNICA
                  </h1>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">NCF:</div>
                  <div className="font-mono text-sm">E310000000031########</div>
                  <div className="text-sm text-gray-600 mt-2">Fecha:</div>
                  <div className="text-sm">{new Date().toLocaleDateString()}</div>
                </div>
              </div>

              {/* Línea separadora */}
              {formData.layout_mostrarLineasSeparadoras && (
                <hr className="mb-4" style={{ borderColor: formData.color_primario }} />
              )}

              {/* Company Info */}
              <div className="mb-6 p-4 rounded" style={{ backgroundColor: formData.color_secundario + "20" }}>
                <h3
                  className="font-semibold mb-2"
                  style={{
                    color: formData.color_secundario,
                    fontSize: `${formData.fuentes_tamaño_subtitulo}px`,
                  }}
                >
                  Información de la Empresa
                </h3>
                <div className="text-sm space-y-1">
                  <div>RNC: [RNC de la empresa]</div>
                  <div>Razón Social: [Razón social de la empresa]</div>
                  <div>Dirección: [Dirección de la empresa]</div>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-6">
                <table className="w-full border-collapse">
                  <thead>
                    <tr style={{ backgroundColor: formData.color_primario, color: "white" }}>
                      <th className={`p-2 text-left ${formData.layout_mostrarBordes ? "border" : ""}`}>Descripción</th>
                      <th className={`p-2 text-center ${formData.layout_mostrarBordes ? "border" : ""}`}>Cant.</th>
                      <th className={`p-2 text-right ${formData.layout_mostrarBordes ? "border" : ""}`}>Precio</th>
                      <th className={`p-2 text-right ${formData.layout_mostrarBordes ? "border" : ""}`}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className={`p-2 ${formData.layout_mostrarBordes ? "border" : ""}`}>Producto de ejemplo</td>
                      <td className={`p-2 text-center ${formData.layout_mostrarBordes ? "border" : ""}`}>1</td>
                      <td className={`p-2 text-right ${formData.layout_mostrarBordes ? "border" : ""}`}>
                        RD$ 1,000.00
                      </td>
                      <td className={`p-2 text-right ${formData.layout_mostrarBordes ? "border" : ""}`}>
                        RD$ 1,000.00
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end mb-6">
                <div className="w-64">
                  <div className="flex justify-between py-1">
                    <span>Subtotal:</span>
                    <span>RD$ 1,000.00</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>ITBIS (18%):</span>
                    <span>RD$ 180.00</span>
                  </div>
                  <div
                    className="flex justify-between py-2 font-bold border-t"
                    style={{ color: formData.color_primario }}
                  >
                    <span>Total:</span>
                    <span>RD$ 1,180.00</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              {formData.pie_pagina && (
                <div className="border-t pt-4 mb-4">
                  <p className="text-sm text-gray-600">{formData.pie_pagina}</p>
                </div>
              )}

              {/* Terms */}
              {formData.terminos_condiciones && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2 text-sm" style={{ color: formData.color_secundario }}>
                    Términos y Condiciones
                  </h4>
                  <p className="text-xs text-gray-600">{formData.terminos_condiciones}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
