"use client"

import { useState, useEffect } from "react"
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pencil, Trash2 } from "lucide-react"
import AddUserForm from "@/components/AddUserForm"
import EditUserForm from "@/components/EditUserForm"
import DeleteConfirmation from "@/components/DeleteConfirmation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ReloadIcon } from "@radix-ui/react-icons"
import { Badge } from "@/components/ui/badge"

interface User {
  id: number
  name: string
  email: string
  role: "admin" | "user"
  status: "active" | "inactive"
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isAddFormOpen, setIsAddFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)
  const { authFetch, isLoading, error } = useAuthenticatedFetch()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const data = await authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/users`)
      if (Array.isArray(data.data)) {
        setUsers(data.data)
      } else {
        console.error("Unexpected data format:", data)
        throw new Error("Unexpected data format received from server")
      }
    } catch (err) {
      console.error("Error fetching users:", err)
    }
  }

  const handleAddUser = async (newUser: Omit<User, "id">) => {
    try {
      await authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUser),
      })
      setIsAddFormOpen(false)
      fetchUsers()
    } catch (err) {
      console.error("Error adding user:", err)
    }
  }

  const handleEditUser = async (updatedUser: User) => {
    try {
      // Prevent editing the admin user
      if (updatedUser.email === "admin@vpaaustralia.com") {
        return
      }

      await authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/users/${updatedUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: updatedUser.role,
          status: updatedUser.status,
        }),
      })
      setEditingUser(null)
      fetchUsers()
    } catch (err) {
      console.error("Error updating user:", err)
    }
  }

  const handleDeleteUser = async (id: number) => {
    try {
      // Prevent deleting the admin user
      const adminUser = users.find((user) => user.id === id && user.email === "admin@vpaaustralia.com")
      if (adminUser) {
        return
      }

      await authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/users/${id}`, {
        method: "DELETE",
      })
      setDeletingUser(null)
      fetchUsers()
    } catch (err) {
      console.error("Error deleting user:", err)
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
          {error.message || "An error occurred while fetching users. Please try again later."}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Users</h1>
        <Button onClick={() => setIsAddFormOpen(true)}>Add User</Button>
      </div>

      {users.length === 0 ? (
        <p>No users found. Add some to get started!</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant={user.role === "admin" ? "default" : "secondary"} className="text-white">
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className="text-white">{user.status}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingUser(user)}
                      disabled={user.email === "admin@vpaaustralia.com"}
                      className={user.email === "admin@vpaaustralia.com" ? "opacity-50 cursor-not-allowed" : ""}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeletingUser(user)}
                      disabled={user.email === "admin@vpaaustralia.com"}
                      className={user.email === "admin@vpaaustralia.com" ? "opacity-50 cursor-not-allowed" : ""}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {isAddFormOpen && <AddUserForm onSubmit={handleAddUser} onCancel={() => setIsAddFormOpen(false)} />}

      {editingUser && (
        <EditUserForm user={editingUser} onSubmit={handleEditUser} onCancel={() => setEditingUser(null)} />
      )}

      {deletingUser && (
        <DeleteConfirmation
          itemName={deletingUser.name}
          onConfirm={() => handleDeleteUser(deletingUser.id)}
          onCancel={() => setDeletingUser(null)}
        />
      )}
    </div>
  )
}

