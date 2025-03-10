"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch"
import { MultiSelect, type Option } from "@/components/ui/multi-select"
import { uploadImage } from "@/lib/uploadImage"

interface AddExerciseFormProps {
  onSubmit: (exercise: {
    name: string
    description: string
    thumbnail_url: string
    is_active: boolean
    categories?: any[]
    bodyParts?: any[]
    equipment?: any[]
    id: number
  }) => void
  onCancel: () => void
}

export default function AddExerciseForm({ onSubmit, onCancel }: AddExerciseFormProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [isActive, setIsActive] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [categories, setCategories] = useState<Option[]>([])
  const [bodyParts, setBodyParts] = useState<Option[]>([])
  const [equipment, setEquipment] = useState<Option[]>([])
  const [selectedCategories, setSelectedCategories] = useState<Option[]>([])
  const [selectedBodyParts, setSelectedBodyParts] = useState<Option[]>([])
  const [selectedEquipment, setSelectedEquipment] = useState<Option[]>([])
  const [videoUrl, setVideoUrl] = useState("")

  const { authFetch } = useAuthenticatedFetch()

  useEffect(() => {
    fetchOptions()
  }, [])

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

    let thumbnail_url = ""
    if (thumbnailFile) {
      try {
        thumbnail_url = await uploadImage(thumbnailFile, "exercise_thumbnails")
      } catch (error) {
        console.error("Error uploading file:", error)
        setIsUploading(false)
        return
      }
    }

    try {
      const exerciseData = {
        name,
        description,
        thumbnail_url,
        is_active: isActive,
        video_url: videoUrl,
      }
      const response = await authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/exercises`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(exerciseData),
      })

      const newExercise = response.data

      // Add relationships
      await Promise.all([
        ...selectedCategories.map((category) =>
          authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/exercises/${newExercise.id}/categories`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ category_id: category.value, exercise_id: newExercise.id }),
          }),
        ),
        ...selectedBodyParts.map((bodyPart) =>
          authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/exercises/body-parts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ body_part_id: bodyPart.value, exercise_id: newExercise.id }),
          }),
        ),
        ...selectedEquipment.map((equip) =>
          authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/exercises/${newExercise.id}/equipment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ equipment_id: equip.value, exercise_id: newExercise.id }),
          }),
        ),
      ])

      onSubmit({
        ...exerciseData,
        id: newExercise.id,
        categories: selectedCategories,
        bodyParts: selectedBodyParts,
        equipment: selectedEquipment,
      })
    } catch (error) {
      console.error("Error adding exercise:", error)
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
    } catch (error) {
      console.error("Error deleting equipment:", error)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Add Exercise</DialogTitle>
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
              <Input id="thumbnail" type="file" onChange={handleFileChange} className="col-span-3" accept="image/*" />
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
              {isUploading ? "Uploading..." : "Add Exercise"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

