"use client"

import { useState, useEffect } from "react"
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pencil, Trash2 } from "lucide-react"
import AddCategoryForm from "@/components/AddCategoryForm"
import EditCategoryForm from "@/components/EditCategoryForm"
import DeleteConfirmation from "@/components/DeleteConfirmation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ReloadIcon } from "@radix-ui/react-icons"

interface Category {
  id: number
  name: string
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isAddFormOpen, setIsAddFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)
  const { authFetch, isLoading, error } = useAuthenticatedFetch()

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const data = await authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/categories`)
      if (Array.isArray(data.data)) {
        setCategories(data.data)
      } else {
        console.error("Unexpected data format:", data)
        throw new Error("Unexpected data format received from server")
      }
    } catch (err) {
      console.error("Error fetching categories:", err)
    }
  }

  const handleAddCategory = async (newCategory: Omit<Category, "id">) => {
    try {
      await authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newCategory),
      })
      setIsAddFormOpen(false)
      fetchCategories()
    } catch (err) {
      console.error("Error adding category:", err)
    }
  }

  const handleEditCategory = async (updatedCategory: Category) => {
    try {
      await authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/categories/${updatedCategory.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedCategory),
      })
      setEditingCategory(null)
      fetchCategories()
    } catch (err) {
      console.error("Error updating category:", err)
    }
  }

  const handleDeleteCategory = async (id: number) => {
    try {
      await authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/categories/${id}`, {
        method: "DELETE",
      })
      setDeletingCategory(null)
      fetchCategories()
    } catch (err) {
      console.error("Error deleting category:", err)
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
          {error.message || "An error occurred while fetching categories. Please try again later."}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Categories</h1>
        <Button onClick={() => setIsAddFormOpen(true)}>Add Category</Button>
      </div>

      {categories.length === 0 ? (
        <p>No categories found. Add some to get started!</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>{category.name}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setEditingCategory(category)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setDeletingCategory(category)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {isAddFormOpen && <AddCategoryForm onSubmit={handleAddCategory} onCancel={() => setIsAddFormOpen(false)} />}

      {editingCategory && (
        <EditCategoryForm
          category={editingCategory}
          onSubmit={handleEditCategory}
          onCancel={() => setEditingCategory(null)}
        />
      )}

      {deletingCategory && (
        <DeleteConfirmation
          itemName={deletingCategory.name}
          onConfirm={() => handleDeleteCategory(deletingCategory.id)}
          onCancel={() => setDeletingCategory(null)}
        />
      )}
    </div>
  )
}

