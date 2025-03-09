"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import Sidebar from "@/components/sidebar"
import { isTokenValid } from "@/utils/auth"

export default function ClientLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setIsAuthenticated(isTokenValid())
  }, [])

  const isAdminRoute = pathname !== "/" && pathname !== "/login"

  return (
    <div className="flex h-screen bg-white">
      {isAuthenticated && isAdminRoute && <Sidebar />}
      <main
        className={`flex-1 overflow-y-auto ${isAdminRoute ? "p-8 bg-white text-secondary" : ""} ${
          isAuthenticated && isAdminRoute ? "" : "w-full"
        }`}
      >
        {children}
      </main>
    </div>
  )
}

