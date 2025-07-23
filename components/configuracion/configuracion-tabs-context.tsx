"use client"

import { createContext, useContext, useState } from "react"

interface TabsContextType {
  reportError: (tab: string) => void
  reportSuccess: (tab: string) => void
  resetErrors: () => void
  errors: Record<string, boolean>
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
  reportError: (tab: string) => void
  reportSuccess: (tab: string) => void
}) {
  const [errors, setErrors] = useState<Record<string, boolean>>({})

  const handleError = (tab: string) => {
    setErrors((prev) => ({ ...prev, [tab]: true }))
    reportError(tab)
  }

  const handleSuccess = (tab: string) => {
    setErrors((prev) => ({ ...prev, [tab]: false }))
    reportSuccess(tab)
  }

  const resetErrors = () => setErrors({})

  return (
    <TabsContext.Provider
      value={{ reportError: handleError, reportSuccess: handleSuccess, resetErrors, errors }}
    >
      {children}
    </TabsContext.Provider>
  )
}
