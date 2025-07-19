import { Suspense } from "react"
import DashboardStats from "@/components/dashboard/dashboard-stats"
import RecentInvoices from "@/components/dashboard/recent-invoices"
import QuickActions from "@/components/dashboard/quick-actions"
import Breadcrumbs from "@/components/layout/breadcrumbs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle } from "lucide-react"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Breadcrumbs />
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center space-x-2">
              <Badge className="bg-green-100 text-green-700 border-green-200 flex items-center space-x-1">
                <CheckCircle className="h-3 w-3" />
                <span>Sistema Operativo</span>
              </Badge>
              <Badge className="bg-blue-100 text-blue-700 border-blue-200">Tiempo Real</Badge>
            </div>
          </div>
        </div>

        {/* Stats Cards and System Status */}
        <div className="mb-8">
          <Suspense
            fallback={
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-20 bg-gray-200 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            }
          >
            <DashboardStats />
          </Suspense>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Recent Invoices */}
          <div className="lg:col-span-2 space-y-8">
            <Suspense
              fallback={
                <Card>
                  <CardHeader>
                    <CardTitle>Cargando comprobantes...</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="animate-pulse space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-16 bg-gray-200 rounded"></div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              }
            >
              <RecentInvoices />
            </Suspense>
          </div>

          {/* Right Column - Quick Actions */}
          <div className="space-y-8">
            <QuickActions />
          </div>
        </div>
      </div>
    </div>
  )
}
