"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PanelMonitoreo } from "@/components/sistema/panel-monitoreo"
import SystemDiagnostics from "@/components/system/diagnostics"
import { Activity, Settings } from "lucide-react"

export default function SistemaPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Sistema</h1>
        <p className="text-muted-foreground">Monitoreo y diagnósticos del sistema de facturación electrónica</p>
      </div>

      <Tabs defaultValue="monitoreo" className="space-y-6">
        <TabsList>
          <TabsTrigger value="monitoreo" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Monitoreo
          </TabsTrigger>
          <TabsTrigger value="diagnosticos" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Diagnósticos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="monitoreo">
          <PanelMonitoreo />
        </TabsContent>

        <TabsContent value="diagnosticos">
          <SystemDiagnostics />
        </TabsContent>
      </Tabs>
    </div>
  )
}
