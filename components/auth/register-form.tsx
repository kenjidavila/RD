"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft,
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  Loader2,
  Flag,
} from "lucide-react"

interface RegisterFormProps {
  onBackToLogin: () => void
}

export default function RegisterForm({ onBackToLogin }: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState({
    nombre: "",
    apellidos: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const validatePassword = (password: string) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
    }
    return requirements
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es requerido"
    }

    if (!formData.apellidos.trim()) {
      newErrors.apellidos = "Los apellidos son requeridos"
    }


    if (!formData.email) {
      newErrors.email = "El correo electrónico es requerido"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Formato de correo electrónico inválido"
    }

    const passwordRequirements = validatePassword(formData.password)
    if (!formData.password) {
      newErrors.password = "La contraseña es requerida"
    } else if (!passwordRequirements.length) {
      newErrors.password = "La contraseña debe tener al menos 8 caracteres"
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Confirma tu contraseña"
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)
    setErrors({})

    try {
      console.log("📝 Enviando datos de registro...")

      const registroData = {
        nombre: formData.nombre.trim(),
        apellidos: formData.apellidos.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      }

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registroData),
      })

      console.log("📥 Response status:", response.status)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log("📥 Response:", result)

      if (result.success) {
        console.log("✅ Registro exitoso")
        alert("¡Registro exitoso! Ya puedes iniciar sesión con tus credenciales.")
        onBackToLogin()
      } else {
        setErrors({ general: result.message || "Error en el registro" })
      }
    } catch (error) {
      console.error("💥 Error en registro:", error)
      setErrors({ general: "Error de conexión. Verifica que el servidor esté funcionando." })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const passwordRequirements = validatePassword(formData.password)

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div
          className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-100"
          style={{
            boxShadow: `
              0 25px 50px -12px rgba(239, 68, 68, 0.15),
              0 25px 50px -12px rgba(59, 130, 246, 0.15),
              0 10px 25px -5px rgba(0, 0, 0, 0.1)
            `,
          }}
        >
          <Button
            variant="ghost"
            onClick={onBackToLogin}
            className="mb-4 hover:bg-gray-100 rounded-xl transition-all duration-200"
            disabled={loading}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Flag className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">e-CF RD</h1>
            <p className="text-gray-600">Facturación Electrónica Dominicana</p>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Crear cuenta</h2>
            <p className="text-gray-600">Completa tus datos para comenzar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-sm text-red-600">{errors.general}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="nombre" className="text-sm font-medium text-gray-700">
                Nombre
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  id="nombre"
                  type="text"
                  placeholder="Juan"
                  value={formData.nombre}
                  onChange={(e) => handleInputChange("nombre", e.target.value)}
                  className={`w-full px-4 py-3 pl-10 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400 ${
                    errors.nombre ? "border-red-300 focus:ring-red-400" : ""
                  }`}
                  required
                  disabled={loading}
                />
              </div>
              {errors.nombre && <p className="text-sm text-red-600 mt-1">{errors.nombre}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="apellidos" className="text-sm font-medium text-gray-700">
                Apellidos
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  id="apellidos"
                  type="text"
                  placeholder="Pérez García"
                  value={formData.apellidos}
                  onChange={(e) => handleInputChange("apellidos", e.target.value)}
                  className={`w-full px-4 py-3 pl-10 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400 ${
                    errors.apellidos ? "border-red-300 focus:ring-red-400" : ""
                  }`}
                  required
                  disabled={loading}
                />
              </div>
              {errors.apellidos && <p className="text-sm text-red-600 mt-1">{errors.apellidos}</p>}
            </div>


            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Correo electrónico
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  id="email"
                  type="email"
                  placeholder="juan@email.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={`w-full px-4 py-3 pl-10 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400 ${
                    errors.email ? "border-red-300 focus:ring-red-400" : ""
                  }`}
                  required
                  disabled={loading}
                />
              </div>
              {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className={`w-full px-4 py-3 pl-10 pr-10 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400 ${
                    errors.password ? "border-red-300 focus:ring-red-400" : ""
                  }`}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                Confirmar contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  className={`w-full px-4 py-3 pl-10 pr-10 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400 ${
                    errors.confirmPassword ? "border-red-300 focus:ring-red-400" : ""
                  }`}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  disabled={loading}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-sm text-red-600 mt-1">{errors.confirmPassword}</p>}
            </div>

            {formData.password && (
              <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-700">Requisitos de contraseña:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div
                    className={`flex items-center ${passwordRequirements.length ? "text-green-600" : "text-gray-400"}`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full mr-2 ${passwordRequirements.length ? "bg-green-500" : "bg-gray-300"}`}
                    ></div>
                    8+ caracteres
                  </div>
                  <div
                    className={`flex items-center ${passwordRequirements.uppercase ? "text-green-600" : "text-gray-400"}`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full mr-2 ${passwordRequirements.uppercase ? "bg-green-500" : "bg-gray-300"}`}
                    ></div>
                    Mayúscula
                  </div>
                  <div
                    className={`flex items-center ${passwordRequirements.lowercase ? "text-green-600" : "text-gray-400"}`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full mr-2 ${passwordRequirements.lowercase ? "bg-green-500" : "bg-gray-300"}`}
                    ></div>
                    Minúscula
                  </div>
                  <div
                    className={`flex items-center ${passwordRequirements.number ? "text-green-600" : "text-gray-400"}`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full mr-2 ${passwordRequirements.number ? "bg-green-500" : "bg-gray-300"}`}
                    ></div>
                    Número
                  </div>
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-red-500 to-blue-600 hover:from-red-600 hover:to-blue-700 text-white text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Creando cuenta...</span>
                </div>
              ) : (
                "Crear cuenta"
              )}
            </Button>

            <div className="text-center pt-4">
              <p className="text-gray-600">
                ¿Ya tienes una cuenta?{" "}
                <button
                  type="button"
                  onClick={onBackToLogin}
                  className="font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200"
                  disabled={loading}
                >
                  Inicia sesión
                </button>
              </p>
            </div>
          </form>
        </div>

        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm flex items-center justify-center">
            <Flag className="h-4 w-4 mr-2" />© 2024 e-CF República Dominicana. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  )
}
