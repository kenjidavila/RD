"use client"
import PerfilEmpresa from "@/components/configuracion/perfil-empresa"
import { ConfiguracionTabsProvider } from "@/components/configuracion/configuracion-tabs-context"

function noop() {}
export default function PerfilEmpresaPage() {
  return (
    <ConfiguracionTabsProvider reportError={noop} reportSuccess={noop}>
      <PerfilEmpresa />
    </ConfiguracionTabsProvider>
  )
}
