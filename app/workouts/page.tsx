"use client"

import { useState, useEffect } from "react"
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pencil, Trash2 } from "lucide-react"
import AddWorkoutForm from "@/components/AddWorkoutForm"
import EditWorkoutForm from "@/components/EditWorkoutForm"
import DeleteConfirmation from "@/components/DeleteConfirmation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ReloadIcon } from "@radix-ui/react-icons"
import Image from "next/image"

interface Workout {
  id: number
  name: string
  description: string
  thumbnail_url: string
  difficulty: string
}

export default function WorkoutsPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [isAddFormOpen, setIsAddFormOpen] = useState(false)
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null)
  const [deletingWorkout, setDeletingWorkout] = useState<Workout | null>(null)
  const { authFetch, isLoading, error } = useAuthenticatedFetch()

  useEffect(() => {
    fetchWorkouts()
  }, [])

  const fetchWorkouts = async () => {
    try {
      const data = await authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/workouts`)
      if (Array.isArray(data.data)) {
        setWorkouts(data.data)
      } else {
        console.error("Unexpected data format:", data)
        throw new Error("Unexpected data format received from server")
      }
    } catch (err) {
      console.error("Error fetching workouts:", err)
    }
  }

  const handleAddWorkout = async (newWorkout: Omit<Workout, "id">) => {
    try {
      setIsAddFormOpen(false)
      fetchWorkouts()
    } catch (err) {
      console.error("Error adding workout:", err)
    }
  }

  const handleEditWorkout = async (updatedWorkout: Workout) => {
    try {
      await authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/workouts/${updatedWorkout.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedWorkout),
      })
      setEditingWorkout(null)
      fetchWorkouts()
    } catch (err) {
      console.error("Error updating workout:", err)
    }
  }

  const handleDeleteWorkout = async (id: number) => {
    try {
      await authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/workouts/${id}`, {
        method: "DELETE",
      })
      setDeletingWorkout(null)
      fetchWorkouts()
    } catch (err) {
      console.error("Error deleting workout:", err)
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
          {error.message || "An error occurred while fetching workouts. Please try again later."}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Workouts</h1>
        <Button onClick={() => setIsAddFormOpen(true)}>Add Workout</Button>
      </div>

      {workouts.length === 0 ? (
        <p>No workouts found. Add some to get started!</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Thumbnail</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workouts.map((workout) => (
              <TableRow key={workout.id}>
                <TableCell>
                  <Image
                    src={workout.thumbnail_url || "/placeholder.svg?height=50&width=50"}
                    alt={workout.name}
                    width={50}
                    height={50}
                    className="rounded-md object-cover"
                  />
                </TableCell>
                <TableCell>{workout.name}</TableCell>
                <TableCell className="max-w-[300px] truncate">{workout.description}</TableCell>
                <TableCell>
                  <span className="capitalize">{workout.difficulty}</span>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setEditingWorkout(workout)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setDeletingWorkout(workout)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {isAddFormOpen && <AddWorkoutForm onSubmit={handleAddWorkout} onCancel={() => setIsAddFormOpen(false)} />}

      {editingWorkout && (
        <EditWorkoutForm
          workout={editingWorkout}
          onSubmit={handleEditWorkout}
          onCancel={() => setEditingWorkout(null)}
        />
      )}

      {deletingWorkout && (
        <DeleteConfirmation
          itemName={deletingWorkout.name}
          onConfirm={() => handleDeleteWorkout(deletingWorkout.id)}
          onCancel={() => setDeletingWorkout(null)}
        />
      )}
    </div>
  )
}

