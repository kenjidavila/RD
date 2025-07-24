"use client"
import React, { createContext, useContext, useEffect, useState } from "react"
import { useEmpresaConfig } from "@/hooks/use-empresa-config"

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
  const { empresa } = useEmpresaConfig()
  const [empresaId, setEmpresaIdState] = useState<string | null>(null)

  useEffect(() => {
    if (empresa) {
      setEmpresaIdState(empresa.id || null)
    }
  }, [empresa])

  const setEmpresaId = (id: string | null) => {
    setEmpresaIdState(id)
  }

  const [empresaState, setEmpresaState] = useState<EmpresaProfile | null>(null)

  const setEmpresa = (emp: EmpresaProfile | null) => {
    setEmpresaState(emp)
  }



  useEffect(() => {
    if (empresa) {
      setEmpresaState(empresa)
    }
  }, [empresa])

  return (
    <EmpresaContext.Provider
      value={{ empresaId, setEmpresaId, empresa: empresaState, setEmpresa }}
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
