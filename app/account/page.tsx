"use client"

import { useState, useEffect } from "react"
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ReloadIcon } from "@radix-ui/react-icons"
import ProfileForm from "@/components/profile-form"
import PasswordForm from "@/components/password-form"

interface User {
  id: number
  name: string
  email: string
}

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null)
  const { authFetch, isLoading, error } = useAuthenticatedFetch()

  const fetchUserData = async () => {
    try {
      const response = await authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/users/auth/me`)
      setUser(response.data)
    } catch (err) {
      console.error("Error fetching user data:", err)
    }
  }

  useEffect(() => {
    fetchUserData()
  }, [authFetch]) // Added authFetch to dependencies

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <ReloadIcon className="mr-2 h-4 w-4 animate-spin" /> Loading...
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error.message || "An error occurred while fetching your account details. Please try again later."}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Account Settings</h1>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Update your personal information.</CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm user={user} onSuccess={fetchUserData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Change your password to keep your account secure.</CardDescription>
            </CardHeader>
            <CardContent>
              <PasswordForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

