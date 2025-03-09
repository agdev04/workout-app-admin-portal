"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

interface BodyPart {
  id: number
  name: string
}

interface EditBodyPartFormProps {
  bodyPart: BodyPart
  onSubmit: (bodyPart: BodyPart) => void
  onCancel: () => void
}

export default function EditBodyPartForm({ bodyPart, onSubmit, onCancel }: EditBodyPartFormProps) {
  const [name, setName] = useState(bodyPart.name)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ ...bodyPart, name })
  }

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Body Part</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">Update Body Part</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

