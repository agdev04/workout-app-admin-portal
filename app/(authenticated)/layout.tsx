"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Sidebar from "@/components/sidebar"
import { isTokenValid, refreshToken, removeToken } from "@/utils/auth"

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      if (!isTokenValid()) {
        const newToken = await refreshToken()
        if (!newToken) {
          router.push("/login")
          return
        }
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/protected-route`, {
          headers: {
            Authorization: `Bearer ${isTokenValid()}`,
          },
        })

        if (!response.ok) {
          throw new Error("Not authorized")
        }

        setIsLoading(false)
      } catch (error) {
        console.error("Authentication error:", error)
        removeToken()
        router.push("/login")
      }
    }

    checkAuth()
  }, [router])

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <>
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8 bg-white text-secondary">{children}</main>
    </>
  )
}

