"use client"

import { createContext, useContext } from "react"

interface TabsContextType {
  reportError: (tab: string) => void
}

const TabsContext = createContext<TabsContextType>({ reportError: () => {} })

export const useConfiguracionTabs = () => useContext(TabsContext)

export function ConfiguracionTabsProvider({ children, reportError }: { children: React.ReactNode; reportError: (tab: string) => void }) {
  return <TabsContext.Provider value={{ reportError }}>{children}</TabsContext.Provider>
}
