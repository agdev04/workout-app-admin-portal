"use client"

import { useState, useEffect } from "react"
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pencil, Trash2 } from "lucide-react"
import AddProgramForm from "@/components/AddProgramForm"
import EditProgramForm from "@/components/EditProgramForm"
import DeleteConfirmation from "@/components/DeleteConfirmation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ReloadIcon } from "@radix-ui/react-icons"
import Image from "next/image"

interface Program {
  id: number
  name: string
  description: string
  image_url: string
  total_weeks: number
}

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [isAddFormOpen, setIsAddFormOpen] = useState(false)
  const [editingProgram, setEditingProgram] = useState<Program | null>(null)
  const [deletingProgram, setDeletingProgram] = useState<Program | null>(null)
  const { authFetch, isLoading, error } = useAuthenticatedFetch()

  useEffect(() => {
    fetchPrograms()
  }, [])

  const fetchPrograms = async () => {
    try {
      const data = await authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/programmes`)
      if (Array.isArray(data.data)) {
        setPrograms(data.data)
      } else {
        console.error("Unexpected data format:", data)
        throw new Error("Unexpected data format received from server")
      }
    } catch (err) {
      console.error("Error fetching programs:", err)
    }
  }

  const handleAddProgram = async (newProgram: Omit<Program, "id">) => {
    try {
      setIsAddFormOpen(false)
      fetchPrograms()
    } catch (err) {
      console.error("Error adding program:", err)
    }
  }

  const handleEditProgram = async (updatedProgram: Program) => {
    try {
      await authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/programmes/${updatedProgram.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedProgram),
      })
      setEditingProgram(null)
      fetchPrograms()
    } catch (err) {
      console.error("Error updating program:", err)
    }
  }

  const handleDeleteProgram = async (id: number) => {
    try {
      await authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/programmes/${id}`, {
        method: "DELETE",
      })
      setDeletingProgram(null)
      fetchPrograms()
    } catch (err) {
      console.error("Error deleting program:", err)
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
          {error.message || "An error occurred while fetching programs. Please try again later."}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Programs</h1>
        <Button onClick={() => setIsAddFormOpen(true)}>Add Program</Button>
      </div>

      {programs.length === 0 ? (
        <p>No programs found. Add some to get started!</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Thumbnail</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Weeks</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {programs.map((program) => (
              <TableRow key={program.id}>
                <TableCell>
                  <Image
                    src={program.image_url || "/placeholder.svg?height=50&width=50"}
                    alt={program.name}
                    width={50}
                    height={50}
                    className="rounded-md object-cover"
                  />
                </TableCell>
                <TableCell>{program.name}</TableCell>
                <TableCell>{program.description}</TableCell>
                <TableCell>{program.total_weeks}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setEditingProgram(program)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setDeletingProgram(program)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {isAddFormOpen && <AddProgramForm onSubmit={handleAddProgram} onCancel={() => setIsAddFormOpen(false)} />}

      {editingProgram && (
        <EditProgramForm
          program={editingProgram}
          onSubmit={handleEditProgram}
          onCancel={() => setEditingProgram(null)}
        />
      )}

      {deletingProgram && (
        <DeleteConfirmation
          itemName={deletingProgram.name}
          onConfirm={() => handleDeleteProgram(deletingProgram.id)}
          onCancel={() => setDeletingProgram(null)}
        />
      )}
    </div>
  )
}

