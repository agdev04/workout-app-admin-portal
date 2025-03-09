"use client"

import type React from "react"

import { useState } from "react"
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { ReloadIcon } from "@radix-ui/react-icons"

interface User {
  id: number
  name: string
  email: string
}

interface ProfileFormProps {
  user: User | null
  onSuccess: () => void
}

export default function ProfileForm({ user, onSuccess }: ProfileFormProps) {
  const [name, setName] = useState(user?.name || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { authFetch } = useAuthenticatedFetch()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/me/update`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      })

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      })

      onSuccess()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update profile. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={user?.email || ""} disabled className="bg-muted" />
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
        Save Changes
      </Button>
    </form>
  )
}

