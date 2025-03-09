"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pencil, Trash2 } from "lucide-react"
import AddExerciseForm from "@/components/AddExerciseForm"
import EditExerciseForm from "@/components/EditExerciseForm"
import DeleteConfirmation from "@/components/DeleteConfirmation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ReloadIcon } from "@radix-ui/react-icons"
import Image from "next/image"

interface Exercise {
  id: number
  name: string
  description: string
  thumbnail_url: string
  is_active: boolean
}

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [isAddFormOpen, setIsAddFormOpen] = useState(false)
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null)
  const [deletingExercise, setDeletingExercise] = useState<Exercise | null>(null)
  const { authFetch, isLoading, error } = useAuthenticatedFetch()

  const fetchExercises = useCallback(async () => {
    try {
      const data = await authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/exercises`)
      if (Array.isArray(data.data)) {
        setExercises(data.data)
      } else {
        console.error("Unexpected data format:", data)
        throw new Error("Unexpected data format received from server")
      }
    } catch (err) {
      console.error("Error fetching exercises:", err)
    }
  }, [authFetch])

  useEffect(() => {
    fetchExercises()
  }, [fetchExercises])

  const handleAddExercise = async (newExercise: Exercise) => {
    // Update local state directly with the new exercise
    setExercises((prev) => [...prev, newExercise])
    setIsAddFormOpen(false)
  }

  const handleEditExercise = async (updatedExercise: Exercise) => {
    try {
      await authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/exercises/${updatedExercise.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedExercise),
      })
      setExercises((prev) => prev.map((exercise) => (exercise.id === updatedExercise.id ? updatedExercise : exercise)))
      setEditingExercise(null)
    } catch (err) {
      console.error("Error updating exercise:", err)
    }
  }

  const handleDeleteExercise = async (id: number) => {
    try {
      await authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/exercises/${id}`, {
        method: "DELETE",
      })
      setExercises((prev) => prev.filter((exercise) => exercise.id !== id))
      setDeletingExercise(null)
    } catch (err) {
      console.error("Error deleting exercise:", err)
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
          {error.message || "An error occurred while fetching exercises. Please try again later."}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Exercises</h1>
        <Button onClick={() => setIsAddFormOpen(true)}>Add Exercise</Button>
      </div>

      {exercises.length === 0 ? (
        <p>No exercises found. Add some to get started!</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Thumbnail</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exercises.map((exercise) => (
              <TableRow key={exercise.id}>
                <TableCell>
                  {exercise.thumbnail_url ? (
                    <Image
                      src={exercise.thumbnail_url || "/placeholder.svg"}
                      alt={exercise.name}
                      width={50}
                      height={50}
                      className="rounded-md"
                    />
                  ) : (
                    <div className="w-[50px] h-[50px] bg-gray-200 rounded-md flex items-center justify-center text-gray-500">
                      No image
                    </div>
                  )}
                </TableCell>
                <TableCell>{exercise.name}</TableCell>
                <TableCell className="max-w-[300px] truncate">{exercise.description}</TableCell>
                <TableCell>{exercise.is_active ? "Yes" : "No"}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setEditingExercise(exercise)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setDeletingExercise(exercise)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {isAddFormOpen && <AddExerciseForm onSubmit={handleAddExercise} onCancel={() => setIsAddFormOpen(false)} />}

      {editingExercise && (
        <EditExerciseForm
          exercise={editingExercise}
          onSubmit={handleEditExercise}
          onCancel={() => setEditingExercise(null)}
        />
      )}

      {deletingExercise && (
        <DeleteConfirmation
          itemName={deletingExercise.name}
          onConfirm={() => handleDeleteExercise(deletingExercise.id)}
          onCancel={() => setDeletingExercise(null)}
        />
      )}
    </div>
  )
}

