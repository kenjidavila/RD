"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Search, CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react"

interface ContribuyenteInfo {
  rnc: string
  nombre: string
  nombre_comercial?: string
  activo: boolean
  estado: string
  categoria: string
  regimen_pagos: string
}

interface RNCLookupProps {
  onRNCFound: (data: ContribuyenteInfo) => void
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  label?: string
  required?: boolean
  disabled?: boolean
}

export function RNCLookup({
  onRNCFound,
  value = "",
  onChange,
  placeholder = "Ingrese RNC/Cédula",
  label = "RNC/Cédula",
  required = false,
  disabled = false,
}: RNCLookupProps) {
  const [inputValue, setInputValue] = useState(value)
  const [isLoading, setIsLoading] = useState(false)
  const [contribuyente, setContribuyente] = useState<ContribuyenteInfo | null>(null)
  const [error, setError] = useState<string>("")
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async () => {
    if (!inputValue.trim()) {
      setError("Debe ingresar un RNC/Cédula")
      return
    }

    setIsLoading(true)
    setError("")
    setContribuyente(null)
    setHasSearched(false)

    try {
      const response = await fetch(`/api/dgii/consultar-rnc?rnc=${inputValue.trim()}`)

      if (response.ok) {
        const result = await response.json()
        setHasSearched(true)

        if (result.success && result.data) {
          setContribuyente(result.data)
          onRNCFound(result.data)

          if (!result.data.activo) {
            setError(`Contribuyente ${result.data.estado.toLowerCase()}`)
          }
        } else {
          setError(result.error || "RNC no encontrado en DGII")
        }
      } else {
        setError("Error de conexión con DGII")
      }
    } catch (error) {
      console.error("Error en búsqueda RNC:", error)
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
    const newValue = e.target.value
    setInputValue(newValue)

    if (onChange) {
      onChange(newValue)
    }

    // Limpiar estado cuando el usuario cambia el valor
    if (hasSearched) {
      setHasSearched(false)
      setContribuyente(null)
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

    if (contribuyente) {
      return contribuyente.activo ? (
        <CheckCircle className="h-4 w-4 text-green-500" />
      ) : (
        <AlertTriangle className="h-4 w-4 text-yellow-500" />
      )
    }

    return <XCircle className="h-4 w-4 text-red-500" />
  }

  const getStatusBadge = () => {
    if (!contribuyente) return null

    return (
      <Badge variant={contribuyente.activo ? "default" : "destructive"} className="text-xs">
        {contribuyente.estado}
      </Badge>
    )
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="rnc-lookup">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            id="rnc-lookup"
            type="text"
            placeholder={placeholder}
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            disabled={disabled || isLoading}
            className="pr-8"
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

      {/* Información del contribuyente */}
      {contribuyente && (
        <div className="bg-gray-50 border rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Información DGII</h4>
            {getStatusBadge()}
          </div>

          <div className="space-y-1 text-sm">
            <div>
              <span className="font-medium">Nombre:</span> {contribuyente.nombre}
            </div>

            {contribuyente.nombre_comercial && (
              <div>
                <span className="font-medium">Nombre Comercial:</span> {contribuyente.nombre_comercial}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
              <div>
                <span className="font-medium">Categoría:</span> {contribuyente.categoria}
              </div>
              <div>
                <span className="font-medium">Régimen:</span> {contribuyente.regimen_pagos}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Errores */}
      {error && (
        <Alert variant={contribuyente && !contribuyente.activo ? "default" : "destructive"}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
