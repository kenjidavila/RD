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
  const [empresaId, setEmpresaIdState] = useState<string | null>(null)
  const [empresa, setEmpresaState] = useState<EmpresaProfile | null>(null)

  const setEmpresaId = (id: string | null) => {
    setEmpresaIdState(id)
    try {
      const stored = localStorage.getItem("empresa_profile")
      if (stored) {
        const data = JSON.parse(stored)
        data.id = id
        localStorage.setItem("empresa_profile", JSON.stringify(data))
      }
    } catch {
      /* ignore */
    }
  }

  const setEmpresa = (emp: EmpresaProfile | null) => {
    setEmpresaState(emp)
    try {
      if (emp) {
        localStorage.setItem("empresa_profile", JSON.stringify(emp))
      } else {
        localStorage.removeItem("empresa_profile")
      }
    } catch {
      /* ignore */
    }
  }

  // Mantener sincronizado el RNC de la empresa en los datos de usuario
  useEffect(() => {
    if (!empresa) return
    try {
      const stored = localStorage.getItem("user_data")
      if (stored) {
        const data = JSON.parse(stored)
        if (empresa.rnc && data.rncEmpresa !== empresa.rnc) {
          data.rncEmpresa = empresa.rnc
          localStorage.setItem("user_data", JSON.stringify(data))
          window.dispatchEvent(new Event("userDataUpdated"))
        }
      }
    } catch (err) {
      console.error("Error actualizando datos de usuario:", err)
    }
  }, [empresa])

  useEffect(() => {
    const loadEmpresa = async () => {
      try {
        const stored = localStorage.getItem("empresa_profile")
        if (stored) {
          const data = JSON.parse(stored)
          setEmpresaIdState(data?.id || null)
          setEmpresaState(data)
        }
      } catch {
        /* ignore */
      }

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
