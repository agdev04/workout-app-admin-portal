"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus, X } from "lucide-react"
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch"

interface QuickAddCategoryProps {
  onCategoryAdded: (category: { id: number; name: string }) => void
}

export function QuickAddCategory({ onCategoryAdded }: QuickAddCategoryProps) {
  const [isFormVisible, setIsFormVisible] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { authFetch } = useAuthenticatedFetch()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, description }),
      })

      onCategoryAdded(response.data)
      setName("")
      setDescription("")
      setIsFormVisible(false)
    } catch (error) {
      console.error("Error adding category:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isFormVisible) {
    return (
      <Button type="button" variant="outline" size="sm" className="mb-2" onClick={() => setIsFormVisible(true)}>
        <Plus className="h-4 w-4 mr-1" /> Add New Category
      </Button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 mb-2 p-4 border rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-medium">Add New Category</h4>
        <Button type="button" variant="ghost" size="sm" onClick={() => setIsFormVisible(false)}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-2">
        <Input placeholder="Category name" value={name} onChange={(e) => setName(e.target.value)} required />
        <Textarea
          placeholder="Category description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>
      <Button type="submit" disabled={isSubmitting} size="sm">
        {isSubmitting ? "Adding..." : "Add Category"}
      </Button>
    </form>
  )
}

