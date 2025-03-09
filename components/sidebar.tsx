"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { removeToken, isTokenValid } from "@/utils/auth"
import { ChevronDown, ChevronRight, LogOut } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { User2 } from "lucide-react"

const Sidebar = () => {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isConfigOpen, setIsConfigOpen] = useState(false)

  useEffect(() => {
    setIsAuthenticated(isTokenValid())
  }, [])

  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    {
      label: "Config",
      subitems: [
        { href: "/body-parts", label: "Body Parts" },
        { href: "/categories", label: "Categories" },
        { href: "/equipment", label: "Equipment" },
        { href: "/users", label: "Users" },
      ],
    },
    { href: "/exercises", label: "Exercises" },
    { href: "/meals", label: "Meals" },
    { href: "/workouts", label: "Workouts" },
    { href: "/programs", label: "Programs" },
  ]

  const handleLogout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      })
      removeToken()
      window.location.href = "/login"
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const toggleConfig = () => {
    setIsConfigOpen(!isConfigOpen)
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <nav className="w-64 bg-secondary text-white shadow-md flex flex-col">
      <div className="p-4 bg-primary">
        <h1 className="text-2xl font-bold">Admin Portal</h1>
      </div>
      <ul className="space-y-2 p-4 flex-grow">
        {navItems.map((item, index) => (
          <li key={index}>
            {item.subitems ? (
              <div>
                <button
                  onClick={toggleConfig}
                  className="flex items-center justify-between w-full p-2 hover:bg-primary rounded transition-colors duration-200"
                >
                  <span>{item.label}</span>
                  {isConfigOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                {isConfigOpen && (
                  <ul className="ml-4 mt-2 space-y-2">
                    {item.subitems.map((subitem, subIndex) => (
                      <li key={subIndex}>
                        <Link
                          href={subitem.href}
                          className={`block p-2 hover:bg-primary rounded transition-colors duration-200 ${
                            pathname === subitem.href ? "bg-primary" : ""
                          }`}
                        >
                          {subitem.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <Link
                href={item.href}
                className={`block p-2 hover:bg-primary rounded transition-colors duration-200 ${
                  pathname === item.href ? "bg-primary" : ""
                }`}
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
      <div className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="w-full bg-secondary hover:bg-secondary/90 text-white justify-start">
              <User2 className="mr-2 h-4 w-4" />
              Account
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px] bg-[#363636] border-[#404040]">
            <DropdownMenuItem asChild>
              <Link href="/account" className="text-white cursor-pointer hover:bg-secondary/90">
                <User2 className="mr-2 h-4 w-4" />
                Account Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#404040]" />
            <DropdownMenuItem onClick={handleLogout} className="text-white cursor-pointer hover:bg-secondary/90">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}

export default Sidebar

