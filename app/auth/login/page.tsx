"use client"

import { useState } from "react"
import LoginForm from "@/components/auth/login-form"
import RegisterForm from "@/components/auth/register-form"

export default function LoginPage() {
  const [showRegister, setShowRegister] = useState(false)

  return (
    <>
      {showRegister ? (
        <RegisterForm onBackToLogin={() => setShowRegister(false)} />
      ) : (
        <LoginForm onShowRegister={() => setShowRegister(true)} />
      )}
    </>
  )
}
