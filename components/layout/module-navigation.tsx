"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  ArrowRight,
  LayoutDashboard,
  FileText,
  Search,
  Users,
  Package,
  Settings,
  BookOpen,
  ExternalLink,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const modules = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Panel principal con estadísticas",
    color: "bg-blue-500",
    textColor: "text-blue-600",
  },
  {
    name: "Emitir e-CF",
    href: "/emitir",
    icon: FileText,
    description: "Crear nuevos comprobantes fiscales",
    color: "bg-green-500",
    textColor: "text-green-600",
    primary: true,
  },
  {
    name: "Consultas",
    href: "/consultas",
    icon: Search,
    description: "Buscar y consultar comprobantes",
    color: "bg-purple-500",
    textColor: "text-purple-600",
  },
  {
    name: "Clientes",
    href: "/clientes",
    icon: Users,
    description: "Gestionar base de clientes",
    color: "bg-orange-500",
    textColor: "text-orange-600",
  },
  {
    name: "Items",
    href: "/items",
    icon: Package,
    description: "Catálogo de productos y servicios",
    color: "bg-indigo-500",
    textColor: "text-indigo-600",
  },
  {
    name: "Configuración",
    href: "/configuracion",
    icon: Settings,
    description: "Ajustes y personalización",
    color: "bg-gray-500",
    textColor: "text-gray-600",
  },
  {
    name: "Documentación",
    href: "/documentacion",
    icon: BookOpen,
    description: "Guías y documentación",
    color: "bg-teal-500",
    textColor: "text-teal-600",
  },
]

interface ModuleNavigationProps {
  currentModule?: string
  showAll?: boolean
  className?: string
}

export default function ModuleNavigation({ currentModule, showAll = false, className = "" }: ModuleNavigationProps) {
  const pathname = usePathname()

  const getCurrentIndex = () => {
    return modules.findIndex((module) => pathname.startsWith(module.href))
  }

  const currentIndex = getCurrentIndex()
  const prevModule = currentIndex > 0 ? modules[currentIndex - 1] : null
  const nextModule = currentIndex < modules.length - 1 ? modules[currentIndex + 1] : null

  if (showAll) {
    return (
      <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${className}`}>
        {modules.map((module, index) => {
          const isActive = pathname.startsWith(module.href)
          return (
            <Link key={module.href} href={module.href}>
              <Card
                className={`group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-2 ${
                  isActive ? "border-primary shadow-lg bg-primary/5" : "border-gray-200 hover:border-primary/30"
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div
                      className={`p-3 rounded-xl ${module.color} bg-opacity-10 group-hover:bg-opacity-20 transition-all duration-300`}
                    >
                      <module.icon className={`h-6 w-6 ${module.textColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                          {module.name}
                        </h3>
                        {module.primary && (
                          <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Principal</Badge>
                        )}
                        {isActive && (
                          <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">Actual</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{module.description}</p>
                      <div className="flex items-center text-xs text-gray-500 group-hover:text-primary transition-colors">
                        <span>Ir al módulo</span>
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    )
  }

  return (
    <div className={`flex items-center justify-between space-x-4 ${className}`}>
      {/* Módulo Anterior */}
      {prevModule ? (
        <Link href={prevModule.href}>
          <Button
            variant="outline"
            className="flex items-center space-x-2 hover:bg-gray-50 transition-all duration-200 hover:shadow-md bg-transparent"
          >
            <ArrowLeft className="h-4 w-4" />
            <div className="text-left">
              <div className="text-xs text-gray-500">Anterior</div>
              <div className="font-medium">{prevModule.name}</div>
            </div>
          </Button>
        </Link>
      ) : (
        <div></div>
      )}

      {/* Módulo Actual */}
      {currentModule && (
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">Módulo actual</div>
          <div className="font-semibold text-gray-900">{currentModule}</div>
        </div>
      )}

      {/* Módulo Siguiente */}
      {nextModule ? (
        <Link href={nextModule.href}>
          <Button
            variant="outline"
            className="flex items-center space-x-2 hover:bg-gray-50 transition-all duration-200 hover:shadow-md bg-transparent"
          >
            <div className="text-right">
              <div className="text-xs text-gray-500">Siguiente</div>
              <div className="font-medium">{nextModule.name}</div>
            </div>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      ) : (
        <div></div>
      )}
    </div>
  )
}
