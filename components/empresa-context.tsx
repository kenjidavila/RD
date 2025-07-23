"use client"
import React, { createContext, useContext, useEffect, useState } from "react"

export interface EmpresaProfile {
  id?: string
  razon_social: string
  nombre_comercial?: string
  rnc: string
  direccion?: string
  telefono?: string
  email?: string
  provincia?: string
  municipio?: string
  logo_url?: string
  created_at?: string
  updated_at?: string
}

interface EmpresaContextValue {
  empresaId: string | null
  setEmpresaId: (id: string | null) => void
  empresa: EmpresaProfile | null
  setEmpresa: (empresa: EmpresaProfile | null) => void
}

const EmpresaContext = createContext<EmpresaContextValue | undefined>(undefined)

export function EmpresaProvider({ children }: { children: React.ReactNode }) {
  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [empresa, setEmpresa] = useState<EmpresaProfile | null>(null)

  useEffect(() => {
    const loadEmpresa = async () => {
      try {
        const res = await fetch("/api/empresa")
        if (res.ok) {
          const result = await res.json()
          setEmpresaId(result.data?.id ?? null)
          setEmpresa(result.data ?? null)
        }
      } catch (err) {
        console.error("Error cargando empresa", err)
      }
    }
    loadEmpresa()
  }, [])

  return (
    <EmpresaContext.Provider
      value={{ empresaId, setEmpresaId, empresa, setEmpresa }}
    >
      {children}
    </EmpresaContext.Provider>
  )
}

export function useEmpresa() {
  const ctx = useContext(EmpresaContext)
  if (!ctx) throw new Error("useEmpresa must be used within EmpresaProvider")
  return ctx
}
