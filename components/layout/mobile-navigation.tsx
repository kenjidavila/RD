"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LayoutDashboard, FileText, Search, Users, Package, Plus, Menu, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const mobileNavItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, color: "text-blue-600" },
  { name: "Emitir", href: "/emitir", icon: FileText, color: "text-green-600", primary: true },
  { name: "Consultas", href: "/consultas", icon: Search, color: "text-purple-600" },
  { name: "Clientes", href: "/clientes", icon: Users, color: "text-orange-600" },
  { name: "Items", href: "/items", icon: Package, color: "text-indigo-600" },
]

export default function MobileNavigation() {
  const [isVisible, setIsVisible] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 100)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl">
        <div className="grid grid-cols-5 gap-1 p-2">
          {mobileNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "flex flex-col items-center space-y-1 h-auto py-2 px-1 relative",
                    isActive ? "bg-primary/10 text-primary" : "text-gray-600",
                  )}
                >
                  <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : item.color)} />
                  <span className="text-xs font-medium truncate w-full text-center">{item.name}</span>
                  {item.primary && (
                    <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 bg-green-500 text-white text-xs flex items-center justify-center">
                      <Plus className="h-2 w-2" />
                    </Badge>
                  )}
                  {isActive && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full"></div>
                  )}
                </Button>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Floating Action Button */}
      <div
        className={cn(
          "lg:hidden fixed bottom-20 right-4 z-40 transition-all duration-300",
          isVisible ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0",
        )}
      >
        <div className="relative">
          {/* Expanded Menu */}
          {isExpanded && (
            <div className="absolute bottom-16 right-0 space-y-2 animate-in slide-in-from-bottom-2">
              <Link href="/emitir">
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white shadow-lg w-full justify-start"
                  onClick={() => setIsExpanded(false)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Emitir e-CF
                </Button>
              </Link>
              <Link href="/clientes?action=new">
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white shadow-lg w-full justify-start"
                  onClick={() => setIsExpanded(false)}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Nuevo Cliente
                </Button>
              </Link>
              <Link href="/items?action=new">
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white shadow-lg w-full justify-start"
                  onClick={() => setIsExpanded(false)}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Nuevo Item
                </Button>
              </Link>
            </div>
          )}

          {/* Main FAB */}
          <Button
            size="lg"
            className="rounded-full w-14 h-14 bg-primary hover:bg-primary/90 shadow-2xl"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Overlay */}
      {isExpanded && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/20 backdrop-blur-sm"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </>
  )
}
