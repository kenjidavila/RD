"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import PerfilEmpresa from "./perfil-empresa"
import CertificadosDigitales from "./certificados-digitales"
import GestionUsuarios from "./gestion-usuarios"
import SecuenciasNCF from "./secuencias-ncf"
import ContingencyManagerComponent from "../contingency/contingency-manager"
import PersonalizacionFacturas from "./personalizacion-facturas"
import {
  ConfiguracionTabsProvider,
  useConfiguracionTabs,
} from "./configuracion-tabs-context"
import { useState } from "react"

export default function ConfiguracionTabs() {
  const [currentTab, setCurrentTab] = useState("perfil")

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

  return (
    <ConfiguracionTabsProvider
      reportError={handleError}
      reportSuccess={handleSuccess}
    >
      <Tabs
        value={currentTab}
        onValueChange={setCurrentTab}
        className="space-y-6"
      >
      <TabsList className="grid w-full grid-cols-6">
        <TabsTrigger value="perfil">Perfil Empresa</TabsTrigger>
        <TabsTrigger value="certificados">Certificados</TabsTrigger>
        <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
        <TabsTrigger value="secuencias">Secuencias NCF</TabsTrigger>
        <TabsTrigger value="contingencia">Contingencia</TabsTrigger>
        <TabsTrigger value="personalizacion">Personalización</TabsTrigger>
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
    </Tabs>
    </ConfiguracionTabsProvider>
  )
}
