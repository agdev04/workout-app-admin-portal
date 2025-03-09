"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ReloadIcon } from "@radix-ui/react-icons"

interface DashboardStats {
  body_parts_count: number
  categories_count: number
  equipment_count: number
  exercises_count: number
  meals_count: number
  programmes_count: number
  users_count: number
  workouts_count: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const { authFetch, isLoading, error } = useAuthenticatedFetch()

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/statistics`)
      if (response.status === "success" && response.data) {
        setStats(response.data)
      } else {
        throw new Error("Failed to fetch statistics")
      }
    } catch (error) {
      console.error("Error fetching statistics:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="flex items-center gap-2">
          <ReloadIcon className="h-5 w-5 animate-spin" />
          <span>Loading statistics...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error.message || "An error occurred while fetching statistics. Please try again later."}
        </AlertDescription>
      </Alert>
    )
  }

  if (!stats) {
    return (
      <Alert>
        <AlertTitle>No Data</AlertTitle>
        <AlertDescription>No statistics available at the moment.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardCard title="Body Parts" count={stats.body_parts_count} link="/body-parts" />
        <DashboardCard title="Categories" count={stats.categories_count} link="/categories" />
        <DashboardCard title="Equipment" count={stats.equipment_count} link="/equipment" />
        <DashboardCard title="Exercises" count={stats.exercises_count} link="/exercises" />
        <DashboardCard title="Meals" count={stats.meals_count} link="/meals" />
        <DashboardCard title="Workouts" count={stats.workouts_count} link="/workouts" />
        <DashboardCard title="Programs" count={stats.programmes_count} link="/programs" />
        <DashboardCard title="Users" count={stats.users_count} link="/users" />
      </div>
    </div>
  )
}

interface DashboardCardProps {
  title: string
  count: number
  link: string
}

function DashboardCard({ title, count, link }: DashboardCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{count}</div>
        <Link href={link}>
          <Button className="mt-4 w-full">View {title}</Button>
        </Link>
      </CardContent>
    </Card>
  )
}

