"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import PerfilEmpresa from "./perfil-empresa"
import CertificadosDigitales from "./certificados-digitales"
import GestionUsuarios from "./gestion-usuarios"
import SecuenciasNCF from "./secuencias-ncf"
import ContingencyManagerComponent from "../contingency/contingency-manager"
import PersonalizacionFacturas from "./personalizacion-facturas"

export default function ConfiguracionTabs() {
  return (
    <Tabs defaultValue="perfil" className="space-y-6">
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
  )
}
