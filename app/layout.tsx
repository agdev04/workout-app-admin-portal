import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import ClientLayoutWrapper from "@/components/client-layout-wrapper"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
      </body>
    </html>
  )
}



import './globals.css'