"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Search, Users, Package, Settings, Plus, Eye, UserPlus, PackagePlus } from "lucide-react"
import { useRouter } from "next/navigation"

export default function QuickActions() {
  const router = useRouter()

  const actions = [
    {
      title: "Emitir e-CF",
      description: "Crear nuevo comprobante fiscal",
      icon: FileText,
      color: "text-crystal-blue-700",
      bgColor: "glass-blue",
      hoverColor: "crystal-blue-hover",
      action: () => router.push("/emitir"),
      primary: true,
    },
    {
      title: "Consultar e-CF",
      description: "Buscar comprobantes emitidos",
      icon: Search,
      color: "text-gray-600",
      bgColor: "glass",
      hoverColor: "crystal-hover",
      action: () => router.push("/consultas"),
    },
    {
      title: "Gestionar Clientes",
      description: "Ver y editar clientes",
      icon: Users,
      color: "text-crystal-red-700",
      bgColor: "glass-red",
      hoverColor: "crystal-red-hover",
      action: () => router.push("/clientes"),
    },
    {
      title: "Gestionar Items",
      description: "Productos y servicios",
      icon: Package,
      color: "text-gray-600",
      bgColor: "glass",
      hoverColor: "crystal-hover",
      action: () => router.push("/items"),
    },
    {
      title: "Configuración",
      description: "Ajustes del sistema",
      icon: Settings,
      color: "text-gray-600",
      bgColor: "glass",
      hoverColor: "crystal-hover",
      action: () => router.push("/configuracion"),
    },
  ]

  const quickButtons = [
    {
      label: "Nuevo Cliente",
      icon: UserPlus,
      action: () => router.push("/clientes?action=new"),
      variant: "outline" as const,
    },
    {
      label: "Nuevo Item",
      icon: PackagePlus,
      action: () => router.push("/items?action=new"),
      variant: "outline" as const,
    },
    {
      label: "Ver Todos",
      icon: Eye,
      action: () => router.push("/consultas"),
      variant: "ghost" as const,
    },
  ]

  return (
    <Card className="card-crystal border-white/30 shadow-crystal">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-bold text-gray-700 flex items-center">
          <Plus className="mr-3 h-6 w-6 text-gray-600" />
          Acciones Rápidas
        </CardTitle>
        <p className="text-gray-500">Accesos directos a funciones principales</p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Acción Principal */}
        <div className="space-y-3">
          {actions
            .filter((action) => action.primary)
            .map((action, index) => (
              <Button
                key={index}
                onClick={action.action}
                className="w-full h-16 btn-crystal-blue crystal-shine shadow-blue-crystal hover:shadow-crystal transition-all duration-300 transform hover:-translate-y-1 bg-slate-50 text-black"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-white/30 backdrop-blur-sm rounded-xl">
                    <action.icon className="h-6 w-6" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-lg">{action.title}</div>
                    <div className="text-sm opacity-80">{action.description}</div>
                  </div>
                </div>
              </Button>
            ))}
        </div>

        {/* Acciones Secundarias */}
        <div className="grid gap-3">
          {actions
            .filter((action) => !action.primary)
            .map((action, index) => (
              <Button
                key={index}
                onClick={action.action}
                variant="ghost"
                className={`w-full h-14 justify-start ${action.bgColor} ${action.hoverColor} group transition-all duration-300 hover:shadow-glass border border-white/20 backdrop-blur-md`}
              >
                <div className="flex items-center space-x-4 w-full">
                  <div
                    className={`p-2 rounded-xl bg-white/20 backdrop-blur-sm group-hover:scale-110 transition-transform duration-300`}
                  >
                    <action.icon className={`h-5 w-5 ${action.color}`} />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-semibold text-gray-700">{action.title}</div>
                    <div className="text-sm text-gray-500">{action.description}</div>
                  </div>
                </div>
              </Button>
            ))}
        </div>

        {/* Botones Rápidos */}
        <div className="pt-4 border-t border-white/20">
          <h4 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">Accesos Rápidos</h4>
          <div className="grid gap-2">
            {quickButtons.map((button, index) => (
              <Button
                key={index}
                onClick={button.action}
                variant={button.variant}
                size="sm"
                className="w-full justify-start text-gray-600 hover:text-gray-700 hover:bg-white/50 backdrop-blur-sm border border-white/20"
              >
                <button.icon className="h-4 w-4 mr-3" />
                {button.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Estado del Sistema */}
        <div className="pt-4 border-t border-white/20">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Estado del sistema</span>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-sm"></div>
              <span className="text-green-600 font-medium">Operativo</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
