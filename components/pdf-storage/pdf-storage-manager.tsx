"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, FileText, CheckCircle, XCircle, RefreshCw } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface PDFRecord {
  id: string
  track_id: string
  e_ncf: string
  tipo_documento: string
  filename: string
  file_size: number
  estado: "disponible" | "descargado" | "expirado"
  tipo_pdf: "preview" | "final"
  fecha_generacion: string
  fecha_expiracion: string
  fecha_descarga?: string
  descargas_count: number
  metadata: Record<string, any>
}

interface PDFStorageStats {
  total_pdfs: number
  total_size_mb: number
  pdfs_disponibles: number
  pdfs_expirados: number
  pdfs_descargados: number
  oldest_pdf: string
  newest_pdf: string
}

export function PDFStorageManager() {
  const [pdfs, setPdfs] = useState<PDFRecord[]>([])
  const [stats, setStats] = useState<PDFStorageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string | null>(null)

  // Filtros
  const [filters, setFilters] = useState({
    tipo_pdf: "all",
    estado: "all",
    search: "",
    limit: 20,
    offset: 0,
  })

  const [total, setTotal] = useState(0)

  useEffect(() => {
    loadPDFs()
    loadStats()
  }, [filters])

  const loadPDFs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()

      if (filters.tipo_pdf !== "all") params.append("tipo_pdf", filters.tipo_pdf)
      if (filters.estado !== "all") params.append("estado", filters.estado)
      params.append("limit", filters.limit.toString())
      params.append("offset", filters.offset.toString())

      const response = await fetch(`/api/pdf-storage/list?${params}`, {
        headers: {
          "x-user-id": "current-user-id", // En producción, obtener del contexto de auth
        },
      })

      if (!response.ok) {
        throw new Error("Error al cargar PDFs")
      }

      const data = await response.json()
      setPdfs(data.pdfs || [])
      setTotal(data.total || 0)
    } catch (error) {
      console.error("Error loading PDFs:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los PDFs almacenados",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch("/api/pdf-storage/stats?empresa_id=current-empresa-id", {
        headers: {
          "x-user-id": "current-user-id", // En producción, obtener del contexto de auth
        },
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error("Error loading stats:", error)
    }
  }

  const downloadPDF = async (pdfId: string, filename: string) => {
    try {
      setDownloading(pdfId)

      const response = await fetch(`/api/pdf-storage/retrieve/${pdfId}`, {
        headers: {
          "x-user-id": "current-user-id", // En producción, obtener del contexto de auth
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al descargar PDF")
      }

      // Crear blob y descargar
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Descarga exitosa",
        description: `PDF ${filename} descargado correctamente`,
      })

      // Recargar lista para actualizar contadores
      loadPDFs()
    } catch (error) {
      console.error("Error downloading PDF:", error)
      toast({
        title: "Error de descarga",
        description: error instanceof Error ? error.message : "Error al descargar PDF",
        variant: "destructive",
      })
    } finally {
      setDownloading(null)
    }
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "disponible":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Disponible
          </Badge>
        )
      case "descargado":
        return (
          <Badge variant="secondary">
            <Download className="w-3 h-3 mr-1" />
            Descargado
          </Badge>
        )
      case "expirado":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Expirado
          </Badge>
        )
      default:
        return <Badge variant="outline">{estado}</Badge>
    }
  }

  const getTipoBadge = (tipo: string) => {
    return tipo === "final" ? <Badge variant="default">Final</Badge> : <Badge variant="outline">Preview</Badge>
  }

  const formatFileSize = (bytes: number) => {
    const mb = bytes / 1024 / 1024
    return `${mb.toFixed(2)} MB`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total PDFs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_pdfs}</div>
              <p className="text-xs text-muted-foreground">{formatFileSize(stats.total_size_mb * 1024 * 1024)} total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Disponibles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.pdfs_disponibles}</div>
              <p className="text-xs text-muted-foreground">Listos para descarga</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Descargados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.pdfs_descargados}</div>
              <p className="text-xs text-muted-foreground">Ya descargados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Expirados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.pdfs_expirados}</div>
              <p className="text-xs text-muted-foreground">No disponibles</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>PDFs Almacenados</CardTitle>
          <CardDescription>Gestiona los PDFs generados y almacenados temporalmente</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por e-NCF o TrackID..."
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                className="w-full"
              />
            </div>

            <Select
              value={filters.tipo_pdf}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, tipo_pdf: value }))}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Tipo PDF" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="final">Final</SelectItem>
                <SelectItem value="preview">Preview</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.estado}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, estado: value }))}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="disponible">Disponible</SelectItem>
                <SelectItem value="descargado">Descargado</SelectItem>
                <SelectItem value="expirado">Expirado</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={loadPDFs} variant="outline" size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Tabla de PDFs */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Documento</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Tamaño</TableHead>
                  <TableHead>Generado</TableHead>
                  <TableHead>Expira</TableHead>
                  <TableHead>Descargas</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-2" />
                      Cargando PDFs...
                    </TableCell>
                  </TableRow>
                ) : pdfs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      No se encontraron PDFs almacenados
                    </TableCell>
                  </TableRow>
                ) : (
                  pdfs.map((pdf) => (
                    <TableRow key={pdf.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{pdf.e_ncf}</div>
                          <div className="text-sm text-muted-foreground">TrackID: {pdf.track_id || "N/A"}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getTipoBadge(pdf.tipo_pdf)}</TableCell>
                      <TableCell>{getEstadoBadge(pdf.estado)}</TableCell>
                      <TableCell>{formatFileSize(pdf.file_size)}</TableCell>
                      <TableCell>
                        <div className="text-sm">{formatDate(pdf.fecha_generacion)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{formatDate(pdf.fecha_expiracion)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{pdf.descargas_count}/10</div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadPDF(pdf.id, pdf.filename)}
                          disabled={pdf.estado !== "disponible" || downloading === pdf.id}
                        >
                          {downloading === pdf.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginación */}
          {total > filters.limit && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Mostrando {filters.offset + 1} a {Math.min(filters.offset + filters.limit, total)} de {total} PDFs
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters((prev) => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }))}
                  disabled={filters.offset === 0}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters((prev) => ({ ...prev, offset: prev.offset + prev.limit }))}
                  disabled={filters.offset + filters.limit >= total}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
