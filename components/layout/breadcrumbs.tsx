"use client"

import type React from "react"

import { ChevronRight, Home } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"

interface BreadcrumbItem {
  label: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
}

const pathMap: Record<string, BreadcrumbItem> = {
  "/dashboard": { label: "Dashboard", href: "/dashboard", icon: Home },
  "/emitir": { label: "Emitir e-CF", href: "/emitir" },
  "/consultas": { label: "Consultas", href: "/consultas" },
  "/clientes": { label: "Clientes", href: "/clientes" },
  "/items": { label: "Items", href: "/items" },
  "/configuracion": { label: "Configuración", href: "/configuracion" },
  "/documentacion": { label: "Documentación", href: "/documentacion" },
}

export default function Breadcrumbs() {
  const pathname = usePathname()

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const segments = pathname.split("/").filter(Boolean)
    const breadcrumbs: BreadcrumbItem[] = []

    // Always start with dashboard
    if (pathname !== "/dashboard") {
      breadcrumbs.push(pathMap["/dashboard"])
    }

    // Add current path
    const currentPath = `/${segments.join("/")}`
    if (pathMap[currentPath] && currentPath !== "/dashboard") {
      breadcrumbs.push(pathMap[currentPath])
    }

    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs()

  if (breadcrumbs.length <= 1) {
    return null
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1
        const Icon = item.icon

        return (
          <div key={item.href} className="flex items-center space-x-2">
            {index > 0 && <ChevronRight className="h-4 w-4 text-gray-400" />}

            {isLast ? (
              <div className="flex items-center space-x-2 text-gray-900 font-medium">
                {Icon && <Icon className="h-4 w-4" />}
                <span>{item.label}</span>
              </div>
            ) : (
              <Link href={item.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                >
                  <div className="flex items-center space-x-1">
                    {Icon && <Icon className="h-4 w-4" />}
                    <span>{item.label}</span>
                  </div>
                </Button>
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}
