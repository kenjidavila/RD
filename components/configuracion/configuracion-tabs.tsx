"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Check, Loader2 } from "lucide-react"

function TabTriggerWithError({
  value,
  children,
}: {
  value: ConfigTabKey
  children: React.ReactNode
}) {
  const { errors, successes, statuses } = useConfiguracionTabs()
  return (
    <TabsTrigger
      value={value}
      className={errors[value] ? "text-red-600" : undefined}
    >
      {children || <span>Sin título</span>}
      {statuses[value]?.state === "pending" && (
        <Loader2 className="h-4 w-4 animate-spin ml-1" />
      )}
      {successes[value] && !errors[value] && (
        <Check className="h-4 w-4 text-green-600 ml-1" />
      )}
      {errors[value] && <Badge variant="destructive" className="ml-2">!</Badge>}
    </TabsTrigger>
  )
}
import PerfilEmpresa from "./perfil-empresa"
import CertificadosDigitales from "./certificados-digitales"
import GestionUsuarios from "./gestion-usuarios"
import SecuenciasNCF from "./secuencias-ncf"
import ContingencyManagerComponent from "../contingency/contingency-manager"
import PersonalizacionFacturas from "./personalizacion-facturas"
import {
  ConfiguracionTabsProvider,
  useConfiguracionTabs,
  type ConfigTabKey,
} from "./configuracion-tabs-context"
import ResumenConfiguracion from "./resumen-configuracion"
import { useState, useEffect } from "react"

export default function ConfiguracionTabs() {
  const [currentTab, setCurrentTab] = useState("perfil")

  useEffect(() => {
    const stored = localStorage.getItem("config_current_tab")
    if (stored) {
      setCurrentTab(stored)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("config_current_tab", currentTab)
  }, [currentTab])

  const handleError = (tab: string) => {
    setCurrentTab(tab)
    // Scroll to top so toast is visible
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handleSuccess = (tab: string) => {
    setCurrentTab(tab)
  }

  const goToTab = (tab: ConfigTabKey) => setCurrentTab(tab)

  return (
    <ConfiguracionTabsProvider
      reportError={handleError}
      reportSuccess={handleSuccess}
      goToTab={goToTab}
    >
      <Tabs
        value={currentTab}
        onValueChange={setCurrentTab}
        className="space-y-6"
      >
      <TabsList className="grid w-full grid-cols-7">
        <TabTriggerWithError value="perfil">Perfil Empresa</TabTriggerWithError>
        <TabTriggerWithError value="certificados">Certificados</TabTriggerWithError>
        <TabTriggerWithError value="usuarios">Usuarios</TabTriggerWithError>
        <TabTriggerWithError value="secuencias">Secuencias NCF</TabTriggerWithError>
        <TabTriggerWithError value="contingencia">Contingencia</TabTriggerWithError>
        <TabTriggerWithError value="personalizacion">Personalización</TabTriggerWithError>
        <TabTriggerWithError value="resumen">Resumen</TabTriggerWithError>
      </TabsList>

      <TabsContent value="perfil" className="space-y-4">
        <PerfilEmpresa />
      </TabsContent>

      <TabsContent value="certificados" className="space-y-4">
        <CertificadosDigitales />
      </TabsContent>

      <TabsContent value="usuarios" className="space-y-4">
        <GestionUsuarios />
      </TabsContent>

      <TabsContent value="secuencias" className="space-y-4">
        <SecuenciasNCF />
      </TabsContent>

      <TabsContent value="contingencia" className="space-y-4">
        <ContingencyManagerComponent />
      </TabsContent>

      <TabsContent value="personalizacion" className="space-y-4">
        <PersonalizacionFacturas />
      </TabsContent>

      <TabsContent value="resumen" className="space-y-4">
        <ResumenConfiguracion />
      </TabsContent>
    </Tabs>
    </ConfiguracionTabsProvider>
  )
}
