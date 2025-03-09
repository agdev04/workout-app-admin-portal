"use client"

import { useState, useEffect } from "react"
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pencil, Trash2 } from "lucide-react"
import AddMealForm from "@/components/AddMealForm"
import EditMealForm from "@/components/EditMealForm"
import DeleteConfirmation from "@/components/DeleteConfirmation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ReloadIcon } from "@radix-ui/react-icons"
import Image from "next/image"

interface Meal {
  id: number
  name: string
  category: string
  description: string
  image_url: string
}

export default function MealsPage() {
  const [meals, setMeals] = useState<Meal[]>([])
  const [isAddFormOpen, setIsAddFormOpen] = useState(false)
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null)
  const [deletingMeal, setDeletingMeal] = useState<Meal | null>(null)
  const { authFetch, isLoading, error } = useAuthenticatedFetch()

  useEffect(() => {
    fetchMeals()
  }, [])

  const fetchMeals = async () => {
    try {
      const data = await authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/meals`)
      if (Array.isArray(data.data)) {
        setMeals(data.data)
      } else {
        console.error("Unexpected data format:", data)
        throw new Error("Unexpected data format received from server")
      }
    } catch (err) {
      console.error("Error fetching meals:", err)
    }
  }

  const handleAddMeal = async (newMeal: Omit<Meal, "id">) => {
    try {
      setIsAddFormOpen(false)
      fetchMeals()
    } catch (err) {
      console.error("Error adding meal:", err)
    }
  }

  const handleEditMeal = async (updatedMeal: Meal) => {
    try {
      await authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/meals/${updatedMeal.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedMeal),
      })
      setEditingMeal(null)
      fetchMeals()
    } catch (err) {
      console.error("Error updating meal:", err)
    }
  }

  const handleDeleteMeal = async (id: number) => {
    try {
      await authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/meals/${id}`, {
        method: "DELETE",
      })
      setDeletingMeal(null)
      fetchMeals()
    } catch (err) {
      console.error("Error deleting meal:", err)
    }
  }

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
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error.message || "An error occurred while fetching meals. Please try again later."}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Meals</h1>
        <Button onClick={() => setIsAddFormOpen(true)}>Add Meal</Button>
      </div>

      {meals.length === 0 ? (
        <p>No meals found. Add some to get started!</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {meals.map((meal) => (
              <TableRow key={meal.id}>
                <TableCell>
                  <Image
                    src={meal.image_url || "/placeholder.svg?height=50&width=50"}
                    alt={meal.name}
                    width={50}
                    height={50}
                    className="rounded-md object-cover"
                  />
                </TableCell>
                <TableCell>{meal.name}</TableCell>
                <TableCell>{meal.category}</TableCell>
                <TableCell className="max-w-[300px] truncate">{meal.description}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setEditingMeal(meal)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setDeletingMeal(meal)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {isAddFormOpen && <AddMealForm onSubmit={handleAddMeal} onCancel={() => setIsAddFormOpen(false)} />}

      {editingMeal && (
        <EditMealForm meal={editingMeal} onSubmit={handleEditMeal} onCancel={() => setEditingMeal(null)} />
      )}

      {deletingMeal && (
        <DeleteConfirmation
          itemName={deletingMeal.name}
          onConfirm={() => handleDeleteMeal(deletingMeal.id)}
          onCancel={() => setDeletingMeal(null)}
        />
      )}
    </div>
  )
}

