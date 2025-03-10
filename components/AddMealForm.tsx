"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GripVertical, Plus, X } from "lucide-react"
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch"
import { uploadImage } from "@/lib/uploadImage"

const mealCategories = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Snacks",
  "Desserts",
  "Beverages",
  "Salads",
  "Soups",
  "Healthy",
  "Vegan",
  "Vegetarian",
  "Keto",
  "Gluten-Free",
  "High-Protein",
  "Seafood",
  "Grilled",
  "Comfort Food",
  "Street Food",
]

interface Ingredient {
  name: string
  amount: string
}

interface Instruction {
  step_number: number
  instruction: string
}

interface AddMealFormProps {
  onSubmit: (meal: { name: string; category: string; description: string; image_url: string }) => void
  onCancel: () => void
}

export default function AddMealForm({ onSubmit, onCancel }: AddMealFormProps) {
  const [name, setName] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [newIngredientName, setNewIngredientName] = useState("")
  const [newIngredientAmount, setNewIngredientAmount] = useState("")
  const [instructions, setInstructions] = useState<Instruction[]>([])
  const [newInstruction, setNewInstruction] = useState("")
  const [draggedInstructionIndex, setDraggedInstructionIndex] = useState<number | null>(null)
  const { authFetch } = useAuthenticatedFetch()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUploading(true)

    let image_url = ""
    if (imageFile) {
      try {
        image_url = await uploadImage(imageFile, "meal_images")
      } catch (error) {
        console.error("Error uploading file:", error)
        setIsUploading(false)
        return
      }
    }

    try {
      const mealResponse = await authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/meals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, category, description, image_url }),
      })

      const newMealId = mealResponse.data.id

      // Add ingredients
      for (const ingredient of ingredients) {
        await authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/meals/ingredients`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            meal_id: newMealId,
            name: ingredient.name,
            amount: ingredient.amount,
          }),
        })
      }

      // Add instructions
      for (const instruction of instructions) {
        await authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/meals/instructions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            meal_id: newMealId,
            step_number: instruction.step_number,
            instruction: instruction.instruction,
          }),
        })
      }

      onSubmit({ name, category, description, image_url })
    } catch (error) {
      console.error("Error adding meal, ingredients, or instructions:", error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0])
    }
  }

  const addIngredient = () => {
    if (newIngredientName && newIngredientAmount) {
      setIngredients([...ingredients, { name: newIngredientName, amount: newIngredientAmount }])
      setNewIngredientName("")
      setNewIngredientAmount("")
    }
  }

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index))
  }

  const addInstruction = () => {
    if (newInstruction) {
      setInstructions([
        ...instructions,
        {
          step_number: instructions.length + 1,
          instruction: newInstruction,
        },
      ])
      setNewInstruction("")
    }
  }

  const removeInstruction = (index: number) => {
    const updatedInstructions = instructions
      .filter((_, i) => i !== index)
      .map((instruction, i) => ({
        ...instruction,
        step_number: i + 1,
      }))
    setInstructions(updatedInstructions)
  }

  const handleDragStart = (index: number) => {
    setDraggedInstructionIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedInstructionIndex === null) return

    const draggedInstruction = instructions[draggedInstructionIndex]
    if (!draggedInstruction) return

    const newInstructions = [...instructions]
    newInstructions.splice(draggedInstructionIndex, 1)
    newInstructions.splice(index, 0, draggedInstruction)

    // Update step numbers
    const updatedInstructions = newInstructions.map((instruction, i) => ({
      ...instruction,
      step_number: i + 1,
    }))

    setInstructions(updatedInstructions)
    setDraggedInstructionIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedInstructionIndex(null)
  }

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Add Meal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4 overflow-y-auto max-h-[calc(80vh-8rem)] mb-10">
            <div className="grid grid-cols-4 items-center gap-4 pr-2">
              <Label htmlFor="name" className="text-left">
                Name
              </Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4 pr-2">
              <Label htmlFor="category" className="text-left">
                Category
              </Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {mealCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4 pr-2">
              <Label htmlFor="description" className="text-left">
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
            <div className="grid grid-cols-4 items-center gap-4 pr-2">
              <Label htmlFor="image" className="text-left">
                Image
              </Label>
              <Input id="image" type="file" onChange={handleFileChange} className="col-span-3" accept="image/*" />
            </div>
            <div className="grid grid-cols-4 items-start gap-4 pr-2">
              <Label className="text-left pt-2">Ingredients</Label>
              <div className="col-span-3 space-y-2">
                {ingredients.map((ingredient, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span>
                      {ingredient.name} - {ingredient.amount}
                    </span>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeIngredient(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Ingredient name"
                    value={newIngredientName}
                    onChange={(e) => setNewIngredientName(e.target.value)}
                  />
                  <Input
                    placeholder="Amount"
                    value={newIngredientAmount}
                    onChange={(e) => setNewIngredientAmount(e.target.value)}
                  />
                  <Button type="button" onClick={addIngredient}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 items-start gap-4 pr-2">
              <Label className="text-left pt-2">Instructions</Label>
              <div className="col-span-3 space-y-2">
                {instructions.map((instruction, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-muted/50 p-2 rounded-md"
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                  >
                    <Button type="button" variant="ghost" size="sm" className="cursor-grab active:cursor-grabbing">
                      <GripVertical className="h-4 w-4" />
                    </Button>
                    <span className="font-medium">{instruction.step_number}.</span>
                    <span className="flex-1">{instruction.instruction}</span>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeInstruction(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <Textarea
                    placeholder="Add instruction step..."
                    value={newInstruction}
                    onChange={(e) => setNewInstruction(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="button" onClick={addInstruction}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUploading}>
              {isUploading ? "Uploading..." : "Add Meal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

