"use client"
import React, { createContext, useContext, useEffect, useState } from "react"

interface EmpresaContextValue {
  empresaId: string | null
  setEmpresaId: (id: string | null) => void
}

const EmpresaContext = createContext<EmpresaContextValue | undefined>(undefined)

export function EmpresaProvider({ children }: { children: React.ReactNode }) {
  const [empresaId, setEmpresaId] = useState<string | null>(null)

  useEffect(() => {
    const loadEmpresa = async () => {
      try {
        const res = await fetch("/api/empresa")
        if (res.ok) {
          const result = await res.json()
          setEmpresaId(result.data?.id ?? null)
        }
      } catch (err) {
        console.error("Error cargando empresa", err)
      }
    }
    loadEmpresa()
  }, [])

  return (
    <EmpresaContext.Provider value={{ empresaId, setEmpresaId }}>
      {children}
    </EmpresaContext.Provider>
  )
}

export function useEmpresa() {
  const ctx = useContext(EmpresaContext)
  if (!ctx) throw new Error("useEmpresa must be used within EmpresaProvider")
  return ctx
}
