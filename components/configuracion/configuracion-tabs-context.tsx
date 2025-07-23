"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"

export type ConfigTabKey =
  | "perfil"
  | "certificados"
  | "usuarios"
  | "secuencias"
  | "contingencia"
  | "personalizacion"
  | "resumen"

export const CONFIG_TABS: ConfigTabKey[] = [
  "perfil",
  "certificados",
  "usuarios",
  "secuencias",
  "contingencia",
  "personalizacion",
  "resumen",
]

interface TabStatus {
  state: "idle" | "pending" | "success" | "error"
  message?: string
}

interface TabsContextType {
  reportError: (tab: ConfigTabKey, message?: string) => void
  reportSuccess: (tab: ConfigTabKey, message?: string) => void
  setPending: (tab: ConfigTabKey, message?: string) => void
  goToTab?: (tab: ConfigTabKey) => void
  resetStatus: () => void
  statuses: Record<ConfigTabKey, TabStatus>
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
  goToTab,
}: {
  children: React.ReactNode
  reportError: (tab: ConfigTabKey) => void
  reportSuccess: (tab: ConfigTabKey) => void
  goToTab?: (tab: ConfigTabKey) => void
}) {
  const initialStatuses = CONFIG_TABS.reduce(
    (acc, key) => ({ ...acc, [key]: { state: "idle" as const } }),
    {} as Record<ConfigTabKey, TabStatus>,
  )
  const [statuses, setStatuses] = useState<Record<ConfigTabKey, TabStatus>>(initialStatuses)
  const errors = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(statuses).map(([k, v]) => [k, v.state === "error"]),
      ) as Record<ConfigTabKey, boolean>,
    [statuses],
  )
  const successes = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(statuses).map(([k, v]) => [k, v.state === "success"]),
      ) as Record<ConfigTabKey, boolean>,
    [statuses],
  )

  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = localStorage.getItem("config_tabs_status")
    if (stored) {
      try {
        setStatuses(JSON.parse(stored))
      } catch {
        /* ignore */
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("config_tabs_status", JSON.stringify(statuses))
    }
  }, [statuses])

  const setPending = (tab: ConfigTabKey, message?: string) => {
    setStatuses((prev) => ({ ...prev, [tab]: { state: "pending", message } }))
  }

  const handleError = (tab: ConfigTabKey, message?: string) => {
    setStatuses((prev) => ({ ...prev, [tab]: { state: "error", message } }))
    reportError(tab)
  }

  const handleSuccess = (tab: ConfigTabKey, message?: string) => {
    setStatuses((prev) => ({ ...prev, [tab]: { state: "success", message } }))
    reportSuccess(tab)
  }

  const resetStatus = () => {
    setStatuses(initialStatuses)
  }

  return (
    <TabsContext.Provider
      value={{
        reportError: handleError,
        reportSuccess: handleSuccess,
        setPending,
        goToTab,
        resetStatus,
        statuses,
        errors,
        successes,
      }}
    >
      {children}
    </TabsContext.Provider>
  )
}
