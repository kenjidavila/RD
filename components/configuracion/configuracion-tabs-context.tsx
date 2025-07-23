"use client"

import { createContext, useContext, useEffect, useState } from "react"

export type ConfigTabKey =
  | "perfil"
  | "certificados"
  | "usuarios"
  | "secuencias"
  | "contingencia"
  | "personalizacion"
  | "resumen"

interface TabsContextType {
  reportError: (tab: ConfigTabKey, message?: string) => void
  reportSuccess: (tab: ConfigTabKey, message?: string) => void
  resetStatus: () => void
  errors: Record<ConfigTabKey, boolean>
  successes: Record<ConfigTabKey, boolean>
}

const TabsContext = createContext<TabsContextType | undefined>(undefined)

export const useConfiguracionTabs = () => {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error(
      "useConfiguracionTabs debe usarse dentro de ConfiguracionTabsProvider",
    )
  }
  return context
}

export function ConfiguracionTabsProvider({
  children,
  reportError,
  reportSuccess,
}: {
  children: React.ReactNode
  reportError: (tab: ConfigTabKey) => void
  reportSuccess: (tab: ConfigTabKey) => void
}) {
  const [errors, setErrors] = useState<Record<ConfigTabKey, boolean>>({} as Record<ConfigTabKey, boolean>)
  const [successes, setSuccesses] = useState<Record<ConfigTabKey, boolean>>({} as Record<ConfigTabKey, boolean>)

  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = localStorage.getItem("config_tabs_status")
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setErrors(parsed.errors || {})
        setSuccesses(parsed.successes || {})
      } catch {
        /* ignore */
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "config_tabs_status",
        JSON.stringify({ errors, successes }),
      )
    }
  }, [errors, successes])

  const handleError = (tab: ConfigTabKey) => {
    setErrors((prev) => ({ ...prev, [tab]: true }))
    setSuccesses((prev) => ({ ...prev, [tab]: false }))
    reportError(tab)
  }

  const handleSuccess = (tab: ConfigTabKey) => {
    setErrors((prev) => ({ ...prev, [tab]: false }))
    setSuccesses((prev) => ({ ...prev, [tab]: true }))
    reportSuccess(tab)
  }

  const resetStatus = () => {
    setErrors({} as Record<ConfigTabKey, boolean>)
    setSuccesses({} as Record<ConfigTabKey, boolean>)
  }

  return (
    <TabsContext.Provider
      value={{ reportError: handleError, reportSuccess: handleSuccess, resetStatus, errors, successes }}
    >
      {children}
    </TabsContext.Provider>
  )
}
