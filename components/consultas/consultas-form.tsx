"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, FileText, Send, Search, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import BorradoresTable from "@/components/borradores/borradores-table"

interface ComprobanteConsulta {
  id: string
  eNCF: string
  rncComprador: string
  razonSocial: string
  fechaEmision: string
  montoTotal: number
  totalItbis: number
  estadoDGII: string
  tipoComprobante: string
  totalItems: number
}

export default function ConsultasForm() {
  const [tipoConsulta, setTipoConsulta] = useState("emitido")
  const [tipoComprobante, setTipoComprobante] = useState("")
  const [eNCF, setENCF] = useState("")
  const [fechaDesde, setFechaDesde] = useState("")
  const [fechaHasta, setFechaHasta] = useState("")
  const [estadoDGII, setEstadoDGII] = useState("todos")
  const [rncComprador, setRncComprador] = useState("")
  const [resultados, setResultados] = useState<ComprobanteConsulta[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const { toast } = useToast()

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aceptado":
        return "bg-green-100 text-green-800"
      case "en_proceso":
        return "bg-yellow-100 text-yellow-800"
      case "rechazado":
        return "bg-red-100 text-red-800"
      case "aceptado_condicional":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "aceptado":
        return "Aceptado"
      case "en_proceso":
        return "En Proceso"
      case "rechazado":
        return "Rechazado"
      case "aceptado_condicional":
        return "Aceptado Condicional"
      default:
        return status
    }
  }

  const handleConsultar = async () => {
    setLoading(true)
    setHasSearched(true)

    try {
      const params = new URLSearchParams({
        tipo_consulta: tipoConsulta,
        ...(tipoComprobante && { tipo_comprobante: tipoComprobante }),
        ...(eNCF && { e_ncf: eNCF }),
        ...(fechaDesde && { fecha_desde: fechaDesde }),
        ...(fechaHasta && { fecha_hasta: fechaHasta }),
        ...(estadoDGII !== "todos" && { estado_dgii: estadoDGII }),
        ...(rncComprador && { rnc_comprador: rncComprador }),
      })

      const response = await fetch(`/api/consultas?${params}`)
      const data = await response.json()

      if (data.success) {
        setResultados(data.data)
        toast({
          title: "Consulta exitosa",
          description: `Se encontraron ${data.data.length} comprobante(s)`,
        })
      } else {
        throw new Error(data.error || "Error en la consulta")
      }
    } catch (error) {
      console.error("Error en consulta:", error)
      toast({
        title: "Error",
        description: "Error al realizar la consulta",
        variant: "destructive",
      })
      setResultados([])
    } finally {
      setLoading(false)
    }
  }

  const handleVerMas = (comprobante: ComprobanteConsulta) => {
    // Aquí podrías abrir un modal con más detalles o navegar a una página de detalles
    console.log("Ver más detalles de:", comprobante)
  }

  const handleVerRepresentacion = (comprobante: ComprobanteConsulta) => {
    // Aquí podrías generar y mostrar la representación impresa
    console.log("Ver representación impresa de:", comprobante)
  }

  const handleEnviarComprador = (comprobante: ComprobanteConsulta) => {
    // Aquí podrías implementar el envío al comprador
    console.log("Enviar al comprador:", comprobante)
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="comprobantes" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="comprobantes">Comprobantes Emitidos</TabsTrigger>
          <TabsTrigger value="borradores">Borradores</TabsTrigger>
        </TabsList>

        <TabsContent value="comprobantes" className="space-y-6">
          {/* Formulario de Consulta */}
          <Card>
            <CardHeader>
              <CardTitle>Parámetros de Consulta</CardTitle>
              <CardDescription>Complete los campos para filtrar los comprobantes fiscales electrónicos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo-consulta">Tipo Consulta</Label>
                  <Select value={tipoConsulta} onValueChange={setTipoConsulta}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="emitido">Emitido</SelectItem>
                      <SelectItem value="recibido">Recibido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo-comprobante">Tipo de e-CF</Label>
                  <Select value={tipoComprobante} onValueChange={setTipoComprobante}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="31">Factura de Crédito Fiscal</SelectItem>
                      <SelectItem value="32">Factura de Consumo</SelectItem>
                      <SelectItem value="33">Nota de Débito</SelectItem>
                      <SelectItem value="34">Nota de Crédito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="e-ncf">e-NCF</Label>
                  <Input
                    id="e-ncf"
                    placeholder="Ingrese e-NCF específico"
                    value={eNCF}
                    onChange={(e) => setENCF(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fecha-desde">Fecha Emisión Desde</Label>
                  <Input
                    id="fecha-desde"
                    type="date"
                    value={fechaDesde}
                    onChange={(e) => setFechaDesde(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fecha-hasta">Fecha Emisión Hasta</Label>
                  <Input
                    id="fecha-hasta"
                    type="date"
                    value={fechaHasta}
                    onChange={(e) => setFechaHasta(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estado-dgii">Estado en DGII</Label>
                  <Select value={estadoDGII} onValueChange={setEstadoDGII}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="aceptado">Aceptado</SelectItem>
                      <SelectItem value="rechazado">Rechazado</SelectItem>
                      <SelectItem value="en_proceso">En Proceso</SelectItem>
                      <SelectItem value="aceptado_condicional">Aceptado Condicional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rnc-comprador">{tipoConsulta === "emitido" ? "RNC Comprador" : "RNC Emisor"}</Label>
                  <Input
                    id="rnc-comprador"
                    placeholder="Ingrese RNC/Cédula"
                    value={rncComprador}
                    onChange={(e) => setRncComprador(e.target.value)}
                  />
                </div>
              </div>

              <Button onClick={handleConsultar} className="w-full md:w-auto" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Consultando...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Consultar
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Resultados */}
          {hasSearched && (
            <Card>
              <CardHeader>
                <CardTitle>Resultados de la Consulta</CardTitle>
                <CardDescription>{resultados.length} comprobante(s) encontrado(s)</CardDescription>
              </CardHeader>
              <CardContent>
                {resultados.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>e-NCF</TableHead>
                          <TableHead>RNC {tipoConsulta === "emitido" ? "Comprador" : "Emisor"}</TableHead>
                          <TableHead>Razón Social</TableHead>
                          <TableHead>Fecha Emisión</TableHead>
                          <TableHead>Monto Total</TableHead>
                          <TableHead>Total ITBIS</TableHead>
                          <TableHead>Estado DGII</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {resultados.map((resultado) => (
                          <TableRow key={resultado.id}>
                            <TableCell className="font-medium">{resultado.eNCF}</TableCell>
                            <TableCell>{resultado.rncComprador}</TableCell>
                            <TableCell>{resultado.razonSocial}</TableCell>
                            <TableCell>{resultado.fechaEmision}</TableCell>
                            <TableCell>RD$ {resultado.montoTotal.toLocaleString()}</TableCell>
                            <TableCell>RD$ {resultado.totalItbis.toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(resultado.estadoDGII)}>
                                {getStatusLabel(resultado.estadoDGII)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Ver más"
                                  onClick={() => handleVerMas(resultado)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Ver representación impresa"
                                  onClick={() => handleVerRepresentacion(resultado)}
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                                {(resultado.estadoDGII === "aceptado" ||
                                  resultado.estadoDGII === "aceptado_condicional") && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    title="Enviar al comprador"
                                    onClick={() => handleEnviarComprador(resultado)}
                                  >
                                    <Send className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No se encontraron comprobantes que coincidan con los criterios de búsqueda.
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="borradores">
          <BorradoresTable />
        </TabsContent>
      </Tabs>
    </div>
  )
}
