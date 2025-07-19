"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  LayoutDashboard,
  FileText,
  Search,
  Settings,
  BookOpen,
  Menu,
  X,
  Users,
  Package,
  ChevronRight,
  ArrowRight,
  Plus,
  Flag,
} from "lucide-react"

const navigation = [
  {
    name: "Panel Principal",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Resumen y estadísticas",
    color: "text-gray-600",
    bgColor: "glass",
    hoverColor: "crystal-hover",
  },
  {
    name: "Emitir e-CF",
    href: "/emitir",
    icon: FileText,
    description: "Crear comprobantes",
    color: "text-crystal-blue-700",
    bgColor: "glass-blue",
    hoverColor: "crystal-blue-hover",
    badge: "Nuevo",
  },
  {
    name: "Consultas",
    href: "/consultas",
    icon: Search,
    description: "Buscar comprobantes",
    color: "text-gray-600",
    bgColor: "glass",
    hoverColor: "crystal-hover",
  },
  {
    name: "Clientes",
    href: "/clientes",
    icon: Users,
    description: "Gestionar clientes",
    color: "text-crystal-red-700",
    bgColor: "glass-red",
    hoverColor: "crystal-red-hover",
  },
  {
    name: "Productos",
    href: "/items",
    icon: Package,
    description: "Catálogo de items",
    color: "text-gray-600",
    bgColor: "glass",
    hoverColor: "crystal-hover",
  },
]

const configNavigation = [
  {
    name: "Configuración",
    href: "/configuracion",
    icon: Settings,
    description: "Ajustes del sistema",
    color: "text-gray-600",
    bgColor: "glass",
    hoverColor: "crystal-hover",
  },
  {
    name: "Documentación",
    href: "/documentacion",
    icon: BookOpen,
    description: "Guías y ayuda",
    color: "text-gray-600",
    bgColor: "glass",
    hoverColor: "crystal-hover",
  },
]

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (href: string) => pathname === href

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="btn-crystal shadow-glass hover:shadow-glass-lg transition-all duration-200"
        >
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 bg-white/60 backdrop-blur-xl transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 border-r border-white/30",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-20 px-6 bg-white/40 backdrop-blur-md border-b border-white/30">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/70 backdrop-blur-md rounded-xl flex items-center justify-center shadow-glass border border-white/30">
                <Flag className="h-5 w-5 text-gray-600" />
              </div>
              <div className="text-gray-700">
                <div className="text-xl font-bold">
                  <span className="text-gray-700">e-CF</span>
                  <span className="text-gray-500 ml-1">RD</span>
                </div>
                <div className="text-xs text-gray-500 font-medium">Facturación Electrónica</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-4 bg-white/30 backdrop-blur-md border-b border-white/20">
            <Link href="/emitir">
              <Button
                className="w-full btn-crystal-blue crystal-shine shadow-blue-crystal hover:shadow-crystal transition-all duration-300 transform hover:-translate-y-0.5 rounded-xl text-black bg-slate-50"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Emitir e-CF
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto">
            {/* Principal Section */}
            <div>
              <h3 className="px-3 text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center">
                <LayoutDashboard className="h-3 w-3 mr-2" />
                Principal
              </h3>
              <div className="space-y-2">
                {navigation.map((item) => {
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "group relative flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 transform hover:translate-x-1",
                        active
                          ? `${item.bgColor} border border-white/40 ${item.color} shadow-glass scale-105 backdrop-blur-md`
                          : `text-gray-600 hover:bg-white/40 hover:text-gray-700 border border-transparent backdrop-blur-sm ${item.hoverColor}`,
                      )}
                      onClick={() => setIsOpen(false)}
                    >
                      <div
                        className={cn(
                          "p-2 rounded-lg mr-3 transition-all duration-200 backdrop-blur-sm",
                          active ? `bg-white/30` : "bg-white/20 group-hover:bg-white/30",
                        )}
                      >
                        <item.icon
                          className={cn(
                            "h-4 w-4 transition-colors duration-200",
                            active ? item.color : "text-gray-500 group-hover:text-gray-600",
                          )}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{item.name}</span>
                          {item.badge && (
                            <Badge className="text-xs bg-green-50/80 backdrop-blur-sm text-green-700 border border-green-200/50 rounded-full">
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                      </div>
                      <ChevronRight
                        className={cn(
                          "h-4 w-4 transition-all duration-200",
                          active ? "text-current transform rotate-90" : "text-gray-400 group-hover:text-gray-500",
                        )}
                      />
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Configuración Section */}
            <div>
              <h3 className="px-3 text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center">
                <Settings className="h-3 w-3 mr-2" />
                Configuración
              </h3>
              <div className="space-y-2">
                {configNavigation.map((item) => {
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "group relative flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 transform hover:translate-x-1",
                        active
                          ? `${item.bgColor} border border-white/40 ${item.color} shadow-glass scale-105 backdrop-blur-md`
                          : `text-gray-600 hover:bg-white/40 hover:text-gray-700 border border-transparent backdrop-blur-sm ${item.hoverColor}`,
                      )}
                      onClick={() => setIsOpen(false)}
                    >
                      <div
                        className={cn(
                          "p-2 rounded-lg mr-3 transition-all duration-200 backdrop-blur-sm",
                          active ? `bg-white/30` : "bg-white/20 group-hover:bg-white/30",
                        )}
                      >
                        <item.icon
                          className={cn(
                            "h-4 w-4 transition-colors duration-200",
                            active ? item.color : "text-gray-500 group-hover:text-gray-600",
                          )}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold">{item.name}</span>
                        <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                      </div>
                      <ChevronRight
                        className={cn(
                          "h-4 w-4 transition-all duration-200",
                          active ? "text-current transform rotate-90" : "text-gray-400 group-hover:text-gray-500",
                        )}
                      />
                    </Link>
                  )
                })}
              </div>
            </div>
          </nav>

          {/* Footer */}
          <div className="p-6 border-t border-white/30 bg-white/30 backdrop-blur-md">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-sm"></div>
                <p className="text-xs text-gray-600 font-medium">Sistema Operativo</p>
              </div>
              <div className="flex items-center justify-center space-x-1">
                <Flag className="h-3 w-3 text-gray-500" />
                <p className="text-xs text-gray-500">e-CF República Dominicana v2.0</p>
              </div>
              <p className="text-xs text-gray-400">© 2024 Todos los derechos reservados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/10 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
