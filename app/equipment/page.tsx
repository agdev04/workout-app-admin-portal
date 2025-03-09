"use client"

import { useState, useEffect } from "react"
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pencil, Trash2 } from "lucide-react"
import AddEquipmentForm from "@/components/AddEquipmentForm"
import EditEquipmentForm from "@/components/EditEquipmentForm"
import DeleteConfirmation from "@/components/DeleteConfirmation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ReloadIcon } from "@radix-ui/react-icons"

interface Equipment {
  id: number
  name: string
}

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [isAddFormOpen, setIsAddFormOpen] = useState(false)
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null)
  const [deletingEquipment, setDeletingEquipment] = useState<Equipment | null>(null)
  const { authFetch, isLoading, error } = useAuthenticatedFetch()

  useEffect(() => {
    fetchEquipment()
  }, [])

  const fetchEquipment = async () => {
    try {
      const data = await authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/equipment`)
      if (Array.isArray(data.data)) {
        setEquipment(data.data)
      } else {
        console.error("Unexpected data format:", data)
        throw new Error("Unexpected data format received from server")
      }
    } catch (err) {
      console.error("Error fetching equipment:", err)
    }
  }

  const handleAddEquipment = async (newEquipment: Omit<Equipment, "id">) => {
    try {
      await authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/equipment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newEquipment),
      })
      setIsAddFormOpen(false)
      fetchEquipment()
    } catch (err) {
      console.error("Error adding equipment:", err)
    }
  }

  const handleEditEquipment = async (updatedEquipment: Equipment) => {
    try {
      await authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/equipment/${updatedEquipment.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedEquipment),
      })
      setEditingEquipment(null)
      fetchEquipment()
    } catch (err) {
      console.error("Error updating equipment:", err)
    }
  }

  const handleDeleteEquipment = async (id: number) => {
    try {
      await authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/equipment/${id}`, {
        method: "DELETE",
      })
      setDeletingEquipment(null)
      fetchEquipment()
    } catch (err) {
      console.error("Error deleting equipment:", err)
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
          {error.message || "An error occurred while fetching equipment. Please try again later."}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Equipment</h1>
        <Button onClick={() => setIsAddFormOpen(true)}>Add Equipment</Button>
      </div>

      {equipment.length === 0 ? (
        <p>No equipment found. Add some to get started!</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {equipment.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setEditingEquipment(item)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setDeletingEquipment(item)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {isAddFormOpen && <AddEquipmentForm onSubmit={handleAddEquipment} onCancel={() => setIsAddFormOpen(false)} />}

      {editingEquipment && (
        <EditEquipmentForm
          equipment={editingEquipment}
          onSubmit={handleEditEquipment}
          onCancel={() => setEditingEquipment(null)}
        />
      )}

      {deletingEquipment && (
        <DeleteConfirmation
          itemName={deletingEquipment.name}
          onConfirm={() => handleDeleteEquipment(deletingEquipment.id)}
          onCancel={() => setDeletingEquipment(null)}
        />
      )}
    </div>
  )
}

