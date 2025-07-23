import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import ClientLayout from "./clientLayout"
import { EmpresaProvider } from "@/components/empresa-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "e-CF República Dominicana - Facturación Electrónica",
  description: "Sistema de Facturación Electrónica para República Dominicana",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <EmpresaProvider>
          <ClientLayout>{children}</ClientLayout>
        </EmpresaProvider>
      </body>
    </html>
  )
}
