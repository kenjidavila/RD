"use client"

import { createContext, useContext } from "react"

interface TabsContextType {
  reportError: (tab: string) => void
  reportSuccess: (tab: string) => void
}

const TabsContext = createContext<TabsContextType>({
  reportError: () => {},
  reportSuccess: () => {},
})

export const useConfiguracionTabs = () => useContext(TabsContext)

export function ConfiguracionTabsProvider({
  children,
  reportError,
  reportSuccess,
}: {
  children: React.ReactNode
  reportError: (tab: string) => void
  reportSuccess: (tab: string) => void
}) {
  return (
    <TabsContext.Provider value={{ reportError, reportSuccess }}>
      {children}
    </TabsContext.Provider>
  )
}
