"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Search, CheckCircle, XCircle, AlertTriangle, Loader2, FileText } from "lucide-react"

interface NCFInfo {
  ncf: string
  nombre: string
  comprobante: string
  vigencia: string
  vigente: boolean
  estado?: string
}

interface NCFLookupProps {
  onNCFFound: (ncf: string) => void
  rncEmisor?: string
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  label?: string
  required?: boolean
  disabled?: boolean
}

export function NCFLookup({
  onNCFFound,
  rncEmisor = "",
  value = "",
  onChange,
  placeholder = "Ingrese NCF",
  label = "NCF",
  required = false,
  disabled = false,
}: NCFLookupProps) {
  const [inputValue, setInputValue] = useState(value)
  const [isLoading, setIsLoading] = useState(false)
  const [ncfInfo, setNCFInfo] = useState<NCFInfo | null>(null)
  const [error, setError] = useState<string>("")
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async () => {
    if (!inputValue.trim()) {
      setError("Debe ingresar un NCF")
      return
    }

    setIsLoading(true)
    setError("")
    setNCFInfo(null)
    setHasSearched(false)

    try {
      const response = await fetch(`/api/dgii/consultar-ncf?rnc=${rncEmisor}&ncf=${inputValue.trim()}`)

      if (response.ok) {
        const result = await response.json()
        setHasSearched(true)

        if (result.success && result.data) {
          setNCFInfo(result.data)
          onNCFFound(result.data.ncf)

          if (!result.data.vigente) {
            setError(`NCF ${result.data.estado?.toLowerCase() || "inválido"}`)
          }
        } else {
          setError(result.error || "NCF no encontrado en DGII")
        }
      } else {
        setError("Error de conexión con DGII")
      }
    } catch (error) {
      console.error("Error en búsqueda NCF:", error)
      setError("Error de conexión con DGII")
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSearch()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toUpperCase()
    setInputValue(newValue)

    if (onChange) {
      onChange(newValue)
    }

    // Limpiar estado cuando el usuario cambia el valor
    if (hasSearched) {
      setHasSearched(false)
      setNCFInfo(null)
      setError("")
    }
  }

  const getStatusIcon = () => {
    if (isLoading) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
    }

    if (!hasSearched) {
      return null
    }

    if (ncfInfo) {
      return ncfInfo.vigente ? (
        <CheckCircle className="h-4 w-4 text-green-500" />
      ) : (
        <AlertTriangle className="h-4 w-4 text-yellow-500" />
      )
    }

    return <XCircle className="h-4 w-4 text-red-500" />
  }

  const getStatusBadge = () => {
    if (!ncfInfo) return null

    return (
      <Badge variant={ncfInfo.vigente ? "default" : "destructive"} className="text-xs">
        {ncfInfo.estado || "Desconocido"}
      </Badge>
    )
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="ncf-lookup">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            id="ncf-lookup"
            type="text"
            placeholder={placeholder}
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            disabled={disabled || isLoading}
            className="pr-8 uppercase"
            maxLength={11}
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">{getStatusIcon()}</div>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleSearch}
          disabled={disabled || isLoading || !inputValue.trim()}
          className="px-3 bg-transparent"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </div>

      {/* Información del NCF */}
      {ncfInfo && (
        <div className="bg-gray-50 border rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-500" />
              <h4 className="font-medium text-sm">Información del Comprobante</h4>
            </div>
            {getStatusBadge()}
          </div>

          <div className="space-y-1 text-sm">
            <div>
              <span className="font-medium">Emisor:</span> {ncfInfo.nombre}
            </div>

            <div>
              <span className="font-medium">Tipo:</span> {ncfInfo.comprobante}
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
              <div>
                <span className="font-medium">NCF:</span> {ncfInfo.ncf}
              </div>
              <div>
                <span className="font-medium">Vigencia:</span> {ncfInfo.vigencia}
              </div>
            </div>

            {/* Indicador de vigencia */}
            <div className="flex items-center gap-2 text-xs">
              {ncfInfo.vigente ? (
                <>
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span className="text-green-600">Vigente</span>
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3 text-red-500" />
                  <span className="text-red-600">Vencido</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Errores */}
      {error && (
        <Alert variant={ncfInfo && !ncfInfo.vigente ? "default" : "destructive"}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Ayuda sobre formato NCF */}
      {!hasSearched && !inputValue && (
        <div className="text-xs text-gray-500">Formato: B01XXXXXXXX (NCF tradicional) o E31XXXXXXXX (e-NCF)</div>
      )}
    </div>
  )
}
