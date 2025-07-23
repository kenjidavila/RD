"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Check, Loader2 } from "lucide-react"
import { useEmpresa } from "@/components/empresa-context"

function TabTriggerWithError({
  value,
  children,
  disabled,
}: {
  value: ConfigTabKey
  children: React.ReactNode
  disabled?: boolean
}) {
  const { errors, successes, statuses } = useConfiguracionTabs()
  return (
    <TabsTrigger
      value={value}
      disabled={disabled}
      className={errors[value] ? "text-red-600" : undefined}
      aria-controls={`${value}-panel`}
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

function TabsInner({
  currentTab,
  onChange,
  empresaId,
}: {
  currentTab: ConfigTabKey
  onChange: (t: ConfigTabKey) => void
  empresaId: string | null
}) {
  const { statuses } = useConfiguracionTabs()

  return (
    <Tabs
      value={currentTab}
      onValueChange={(tab) => {
        const state = statuses[currentTab]?.state
        if (state === "pending") return
        if (state === "error") {
          if (!confirm("Hay errores sin corregir en este formulario. ¿Desea cambiar de pestaña?")) {
            return
          }
        }
        if (!empresaId && tab !== "perfil") return
        onChange(tab as ConfigTabKey)
      }}
      className="space-y-6"
    >
      <TabsList className="grid w-full grid-cols-7">
        <TabTriggerWithError value="perfil">Perfil Empresa</TabTriggerWithError>
        <TabTriggerWithError value="certificados" disabled={!empresaId}>
          Certificados
        </TabTriggerWithError>
        <TabTriggerWithError value="usuarios" disabled={!empresaId}>
          Usuarios
        </TabTriggerWithError>
        <TabTriggerWithError value="secuencias" disabled={!empresaId}>
          Secuencias NCF
        </TabTriggerWithError>
        <TabTriggerWithError value="contingencia" disabled={!empresaId}>
          Contingencia
        </TabTriggerWithError>
        <TabTriggerWithError value="personalizacion" disabled={!empresaId}>
          Personalización
        </TabTriggerWithError>
        <TabTriggerWithError value="resumen" disabled={!empresaId}>
          Resumen
        </TabTriggerWithError>
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
  )
}

export default function ConfiguracionTabs() {
  const [currentTab, setCurrentTab] = useState("perfil")
  const { empresaId } = useEmpresa()

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
      <TabsInner
        currentTab={currentTab as ConfigTabKey}
        onChange={(t) => setCurrentTab(t)}
        empresaId={empresaId}
      />
    </ConfiguracionTabsProvider>
  )
}
