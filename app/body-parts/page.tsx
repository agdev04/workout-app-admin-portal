"use client"

import { useState, useEffect } from "react"
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pencil, Trash2 } from "lucide-react"
import AddBodyPartForm from "@/components/AddBodyPartForm"
import EditBodyPartForm from "@/components/EditBodyPartForm"
import DeleteConfirmation from "@/components/DeleteConfirmation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ReloadIcon } from "@radix-ui/react-icons"

interface BodyPart {
  id: number
  name: string
}

export default function BodyPartsPage() {
  const [bodyParts, setBodyParts] = useState<BodyPart[]>([])
  const [isAddFormOpen, setIsAddFormOpen] = useState(false)
  const [editingBodyPart, setEditingBodyPart] = useState<BodyPart | null>(null)
  const [deletingBodyPart, setDeletingBodyPart] = useState<BodyPart | null>(null)
  const { authFetch, isLoading, error } = useAuthenticatedFetch()

  useEffect(() => {
    fetchBodyParts()
  }, [])

  const fetchBodyParts = async () => {
    try {
      const data = await authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/body-parts`)
      if (Array.isArray(data.data)) {
        setBodyParts(data.data)
      } else {
        console.error("Unexpected data format:", data)
        throw new Error("Unexpected data format received from server")
      }
    } catch (err) {
      console.error("Error fetching body parts:", err)
    }
  }

  const handleAddBodyPart = async (newBodyPart: Omit<BodyPart, "id">) => {
    try {
      await authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/body-parts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newBodyPart),
      })
      setIsAddFormOpen(false)
      fetchBodyParts()
    } catch (err) {
      console.error("Error adding body part:", err)
    }
  }

  const handleEditBodyPart = async (updatedBodyPart: BodyPart) => {
    try {
      await authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/body-parts/${updatedBodyPart.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedBodyPart),
      })
      setEditingBodyPart(null)
      fetchBodyParts()
    } catch (err) {
      console.error("Error updating body part:", err)
    }
  }

  const handleDeleteBodyPart = async (id: number) => {
    try {
      await authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/body-parts/${id}`, {
        method: "DELETE",
      })
      setDeletingBodyPart(null)
      fetchBodyParts()
    } catch (err) {
      console.error("Error deleting body part:", err)
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
          {error.message || "An error occurred while fetching body parts. Please try again later."}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Body Parts</h1>
        <Button onClick={() => setIsAddFormOpen(true)}>Add Body Part</Button>
      </div>

      {bodyParts.length === 0 ? (
        <p>No body parts found. Add some to get started!</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bodyParts.map((bodyPart) => (
              <TableRow key={bodyPart.id}>
                <TableCell>{bodyPart.name}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setEditingBodyPart(bodyPart)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setDeletingBodyPart(bodyPart)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {isAddFormOpen && <AddBodyPartForm onSubmit={handleAddBodyPart} onCancel={() => setIsAddFormOpen(false)} />}

      {editingBodyPart && (
        <EditBodyPartForm
          bodyPart={editingBodyPart}
          onSubmit={handleEditBodyPart}
          onCancel={() => setEditingBodyPart(null)}
        />
      )}

      {deletingBodyPart && (
        <DeleteConfirmation
          itemName={deletingBodyPart.name}
          onConfirm={() => handleDeleteBodyPart(deletingBodyPart.id)}
          onCancel={() => setDeletingBodyPart(null)}
        />
      )}
    </div>
  )
}

