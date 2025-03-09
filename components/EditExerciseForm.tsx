"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { storage } from "@/lib/firebase"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import Image from "next/image"
import { MultiSelect, type Option } from "@/components/ui/multi-select"
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch"

interface Exercise {
  id: number
  name: string
  description: string
  thumbnail_url: string
  is_active: boolean
  video_url?: string
  categories?: { id: number; name: string }[]
  body_parts?: { id: number; name: string }[]
  equipment?: { id: number; name: string }[]
}

interface EditExerciseFormProps {
  exercise: Exercise
  onSubmit: (exercise: Exercise) => void
  onCancel: () => void
}

export default function EditExerciseForm({ exercise, onSubmit, onCancel }: EditExerciseFormProps) {
  const [name, setName] = useState(exercise.name)
  const [description, setDescription] = useState(exercise.description)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailUrl, setThumbnailUrl] = useState(exercise.thumbnail_url)
  const [isActive, setIsActive] = useState(exercise.is_active)
  const [videoUrl, setVideoUrl] = useState(exercise.video_url || "")
  const [isUploading, setIsUploading] = useState(false)
  const [categories, setCategories] = useState<Option[]>([])
  const [bodyParts, setBodyParts] = useState<Option[]>([])
  const [equipment, setEquipment] = useState<Option[]>([])
  const [selectedCategories, setSelectedCategories] = useState<Option[]>([])
  const [selectedBodyParts, setSelectedBodyParts] = useState<Option[]>([])
  const [selectedEquipment, setSelectedEquipment] = useState<Option[]>([])
  const { authFetch } = useAuthenticatedFetch()

  useEffect(() => {
    fetchOptions()
    // Pre-select the options based on the exercise object
    setSelectedCategories(exercise.categories?.map((cat) => ({ value: cat.id, label: cat.name })) || [])
    setSelectedBodyParts(exercise.body_parts?.map((bp) => ({ value: bp.id, label: bp.name })) || [])
    setSelectedEquipment(exercise.equipment?.map((eq) => ({ value: eq.id, label: eq.name })) || [])
  }, [exercise])

  const fetchOptions = async () => {
    try {
      const [categoriesData, bodyPartsData, equipmentData] = await Promise.all([
        authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/categories`),
        authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/body-parts`),
        authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/equipment`),
      ])

      setCategories(categoriesData.data.map((item: any) => ({ value: item.id, label: item.name })))
      setBodyParts(bodyPartsData.data.map((item: any) => ({ value: item.id, label: item.name })))
      setEquipment(equipmentData.data.map((item: any) => ({ value: item.id, label: item.name })))
    } catch (error) {
      console.error("Error fetching options:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUploading(true)

    let new_thumbnail_url = thumbnailUrl
    if (thumbnailFile) {
      try {
        const storageRef = ref(storage, `exercise_thumbnails/${Date.now()}_${thumbnailFile.name}`)
        const snapshot = await uploadBytes(storageRef, thumbnailFile)
        new_thumbnail_url = await getDownloadURL(snapshot.ref)
      } catch (error) {
        console.error("Error uploading file:", error)
        setIsUploading(false)
        return
      }
    }

    try {
      const updatedExercise = {
        ...exercise,
        name,
        description,
        thumbnail_url: new_thumbnail_url,
        is_active: isActive,
        video_url: videoUrl,
      }

      await authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/exercises/${exercise.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedExercise),
      })

      // Helper function to get added and removed items
      const getAddedAndRemovedItems = (original: Option[], updated: Option[]) => {
        const originalIds = new Set(original.map((item) => item.value))
        const updatedIds = new Set(updated.map((item) => item.value))
        const added = updated.filter((item) => !originalIds.has(item.value))
        const removed = original.filter((item) => !updatedIds.has(item.value))
        return { added, removed }
      }

      // Update body parts
      const { added: addedBodyParts, removed: removedBodyParts } = getAddedAndRemovedItems(
        exercise.body_parts?.map((bp) => ({ value: bp.id, label: bp.name })) || [],
        selectedBodyParts,
      )

      for (const bodyPart of addedBodyParts) {
        await authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/exercises/body-parts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ exercise_id: exercise.id, body_part_id: bodyPart.value }),
        })
      }

      for (const bodyPart of removedBodyParts) {
        await authFetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/exercises/${exercise.id}/body-parts/${bodyPart.value}`,
          {
            method: "DELETE",
          },
        )
      }

      // Update categories
      const { added: addedCategories, removed: removedCategories } = getAddedAndRemovedItems(
        exercise.categories?.map((cat) => ({ value: cat.id, label: cat.name })) || [],
        selectedCategories,
      )

      for (const category of addedCategories) {
        await authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/exercises/${exercise.id}/categories`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ exercise_id: exercise.id, category_id: category.value }),
        })
      }

      for (const category of removedCategories) {
        await authFetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/exercises/${exercise.id}/categories/${category.value}`,
          {
            method: "DELETE",
          },
        )
      }

      // Update equipment
      const { added: addedEquipment, removed: removedEquipment } = getAddedAndRemovedItems(
        exercise.equipment?.map((eq) => ({ value: eq.id, label: eq.name })) || [],
        selectedEquipment,
      )

      for (const equipment of addedEquipment) {
        await authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/exercises/${exercise.id}/equipment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ exercise_id: exercise.id, equipment_id: equipment.value }),
        })
      }

      for (const equipment of removedEquipment) {
        await authFetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/exercises/${exercise.id}/equipment/${equipment.value}`,
          {
            method: "DELETE",
          },
        )
      }

      // Update the exercise object with the new selections
      updatedExercise.body_parts = selectedBodyParts.map((bp) => ({ id: Number(bp.value), name: bp.label }))
      updatedExercise.categories = selectedCategories.map((cat) => ({ id: Number(cat.value), name: cat.label }))
      updatedExercise.equipment = selectedEquipment.map((eq) => ({ id: Number(eq.value), name: eq.label }))

      onSubmit(updatedExercise)
    } catch (error) {
      console.error("Error updating exercise:", error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setThumbnailFile(e.target.files[0])
    }
  }

  const handleAddNewCategory = (updatedOptions: Option[]) => {
    setCategories(updatedOptions)
  }

  const handleAddNewBodyPart = (updatedOptions: Option[]) => {
    setBodyParts(updatedOptions)
  }

  const handleAddNewEquipment = (updatedOptions: Option[]) => {
    setEquipment(updatedOptions)
  }

  const handleDeleteCategory = async (option: Option) => {
    try {
      await authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/categories/${option.value}`, {
        method: "DELETE",
      })
      setCategories(categories.filter((cat) => cat.value !== option.value))
      setSelectedCategories(selectedCategories.filter((cat) => cat.value !== option.value))
    } catch (error) {
      console.error("Error deleting category:", error)
    }
  }

  const handleDeleteBodyPart = async (option: Option) => {
    try {
      await authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/body-parts/${option.value}`, {
        method: "DELETE",
      })
      setBodyParts(bodyParts.filter((bp) => bp.value !== option.value))
      setSelectedBodyParts(selectedBodyParts.filter((bp) => bp.value !== option.value))
    } catch (error) {
      console.error("Error deleting body part:", error)
    }
  }

  const handleDeleteEquipment = async (option: Option) => {
    try {
      await authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/equipment/${option.value}`, {
        method: "DELETE",
      })
      setEquipment(equipment.filter((eq) => eq.value !== option.value))
      setSelectedEquipment(selectedEquipment.filter((eq) => eq.value !== option.value))
    } catch (error) {
      console.error("Error deleting equipment:", error)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Edit Exercise</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="thumbnail" className="text-right">
                Thumbnail
              </Label>
              <div className="col-span-3">
                {thumbnailUrl && (
                  <div className="mb-2">
                    <Image
                      src={thumbnailUrl || "/placeholder.svg"}
                      alt="Current thumbnail"
                      width={100}
                      height={100}
                      className="rounded-md"
                    />
                  </div>
                )}
                <Input id="thumbnail" type="file" onChange={handleFileChange} className="col-span-3" accept="image/*" />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="video" className="text-right">
                Video URL
              </Label>
              <Input
                id="video"
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://example.com/video.mp4"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="categories" className="text-right">
                Categories
              </Label>
              <div className="col-span-3">
                <MultiSelect
                  options={categories}
                  selected={selectedCategories}
                  onChange={setSelectedCategories}
                  onAddNewOption={handleAddNewCategory}
                  onDeleteOption={handleDeleteCategory}
                  type="category"
                  className="col-span-3"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bodyParts" className="text-right">
                Body Parts
              </Label>
              <div className="col-span-3">
                <MultiSelect
                  options={bodyParts}
                  selected={selectedBodyParts}
                  onChange={setSelectedBodyParts}
                  onAddNewOption={handleAddNewBodyPart}
                  onDeleteOption={handleDeleteBodyPart}
                  type="bodyPart"
                  className="col-span-3"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="equipment" className="text-right">
                Equipment
              </Label>
              <div className="col-span-3">
                <MultiSelect
                  options={equipment}
                  selected={selectedEquipment}
                  onChange={setSelectedEquipment}
                  onAddNewOption={handleAddNewEquipment}
                  onDeleteOption={handleDeleteEquipment}
                  type="equipment"
                  className="col-span-3"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="is_active" className="text-right">
                Active
              </Label>
              <Switch id="is_active" checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUploading}>
              {isUploading ? "Uploading..." : "Update Exercise"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

