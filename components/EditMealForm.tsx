"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import Image from "next/image"
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
  id?: number
  meal_id?: number
  name: string
  amount: string
}

interface Instruction {
  id?: number
  meal_id?: number
  step_number: number
  instruction: string
}

interface Meal {
  id: number
  name: string
  category: string
  description: string
  image_url: string
  prep_time: string
  servings: number
  calories: string
  protein: string
  fat: string
  carbs: string
  difficulty: string
  ingredients?: Ingredient[]
  instructions?: Instruction[]
}

interface EditMealFormProps {
  meal: Meal
  onSubmit: (meal: Meal) => void
  onCancel: () => void
}

export default function EditMealForm({ meal, onSubmit, onCancel }: EditMealFormProps) {
  const [name, setName] = useState(meal.name)
  const [category, setCategory] = useState(meal.category)
  const [description, setDescription] = useState(meal.description)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState(meal.image_url)
  const [prepTime, setPrepTime] = useState(meal.prep_time)
  const [servings, setServings] = useState(meal.servings)
  const [calories, setCalories] = useState(meal.calories)
  const [protein, setProtein] = useState(meal.protein)
  const [fat, setFat] = useState(meal.fat)
  const [carbs, setCarbs] = useState(meal.carbs)
  const [difficulty, setDifficulty] = useState(meal.difficulty)
  const [isUploading, setIsUploading] = useState(false)
  const [ingredients, setIngredients] = useState<Ingredient[]>(meal.ingredients || [])
  const [newIngredientName, setNewIngredientName] = useState("")
  const [newIngredientAmount, setNewIngredientAmount] = useState("")
  const [instructions, setInstructions] = useState<Instruction[]>(meal.instructions || [])
  const [newInstruction, setNewInstruction] = useState("")
  const [draggedInstructionIndex, setDraggedInstructionIndex] = useState<number | null>(null)
  const { authFetch } = useAuthenticatedFetch()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUploading(true)

    let new_image_url = imageUrl
    if (imageFile) {
      try {
        new_image_url = await uploadImage(imageFile, "meal_images")
      } catch (error) {
        console.error("Error uploading file:", error)
        setIsUploading(false)
        return
      }
    }

    try {
      // Update meal basic info
      await authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/meals/${meal.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          name, 
          category, 
          description, 
          image_url: new_image_url,
          prep_time: prepTime,
          servings,
          calories,
          protein,
          fat,
          carbs,
          difficulty
        }),
      })

      // Handle ingredients updates
      const originalIngredients = meal.ingredients || []
      const updatedIngredients = ingredients

      // Find ingredients to remove (present in original but not in updated)
      const ingredientsToRemove = originalIngredients.filter(
        (original) => !updatedIngredients.some((updated) => updated.id === original.id),
      )

      // Find ingredients to add (present in updated but not in original)
      const ingredientsToAdd = updatedIngredients.filter(
        (updated) => !updated.id, // New ingredients won't have an ID
      )

      // Delete removed ingredients
      await Promise.all(
        ingredientsToRemove.map((ingredient) =>
          authFetch(
            `${process.env.NEXT_PUBLIC_BASE_URL}/meals/${meal.id}/ingredients/${ingredient.id}`,
            {
              method: "DELETE",
            },
          ),
        ),
      )

      // Add new ingredients
      await Promise.all(
        ingredientsToAdd.map((ingredient) =>
          authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/meals/ingredients`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              meal_id: meal.id,
              name: ingredient.name,
              amount: ingredient.amount,
            }),
          }),
        ),
      )

      // Handle instructions updates - Delete all existing instructions
      if (meal.instructions) {
        await Promise.all(
          meal.instructions.map((instruction) =>
            authFetch(
              `${process.env.NEXT_PUBLIC_BASE_URL}/meals/${meal.id}/instructions/${instruction.id}`,
              {
                method: "DELETE",
              },
            ),
          ),
        )
      }

      // Add all instructions with updated step numbers
      await Promise.all(
        instructions.map((instruction, index) =>
          authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/meals/instructions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              meal_id: meal.id,
              step_number: index + 1,
              instruction: instruction.instruction,
            }),
          }),
        ),
      )

      onSubmit({
        ...meal,
        name,
        category,
        description,
        image_url: new_image_url,
        prep_time: prepTime,
        servings,
        calories,
        protein,
        fat,
        carbs,
        difficulty,
        ingredients: updatedIngredients,
        instructions,
      })
    } catch (error) {
      console.error("Error updating meal:", error)
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
          <DialogTitle>Edit Meal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4 overflow-y-auto max-h-[calc(80vh-8rem)]">
            <div className="grid grid-cols-4 items-center gap-4 pr-2">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4 pr-2">
              <Label htmlFor="category" className="text-right">
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
            <div className="grid grid-cols-4 items-center gap-4 pr-2">
              <Label htmlFor="image" className="text-right">
                Image
              </Label>
              <div className="col-span-3">
                {imageUrl && (
                  <div className="mb-2">
                    <Image
                      src={imageUrl || "/placeholder.svg"}
                      alt="Current meal image"
                      width={100}
                      height={100}
                      className="rounded-md"
                    />
                  </div>
                )}
                <Input id="image" type="file" onChange={handleFileChange} className="col-span-3" accept="image/*" />
              </div>
            </div>
            <div className="grid grid-cols-4 items-start gap-4 pr-2">
              <Label className="text-right pt-2">Ingredients</Label>
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
              <Label className="text-right pt-2">Instructions</Label>
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
            <div className="grid grid-cols-4 items-center gap-4 pr-2">
              <Label htmlFor="prepTime" className="text-right">
                Prep Time
              </Label>
              <Input
                id="prepTime"
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
                className="col-span-3"
                required
                placeholder="e.g., 30 minutes"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4 pr-2">
              <Label htmlFor="servings" className="text-right">
                Servings
              </Label>
              <Input
                id="servings"
                type="number"
                value={servings}
                onChange={(e) => setServings(parseInt(e.target.value))}
                className="col-span-3"
                required
                min="1"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4 pr-2">
              <Label htmlFor="calories" className="text-right">
                Calories
              </Label>
              <Input
                id="calories"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                className="col-span-3"
                required
                placeholder="e.g., 500 kcal"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4 pr-2">
              <Label htmlFor="protein" className="text-right">
                Protein
              </Label>
              <Input
                id="protein"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                className="col-span-3"
                required
                placeholder="e.g., 20g"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4 pr-2">
              <Label htmlFor="fat" className="text-right">
                Fat
              </Label>
              <Input
                id="fat"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                className="col-span-3"
                required
                placeholder="e.g., 15g"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4 pr-2">
              <Label htmlFor="carbs" className="text-right">
                Carbs
              </Label>
              <Input
                id="carbs"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                className="col-span-3"
                required
                placeholder="e.g., 60g"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4 pr-2">
              <Label htmlFor="difficulty" className="text-right">
                Difficulty
              </Label>
              <Select value={difficulty} onValueChange={setDifficulty} required>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select difficulty level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="pr-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUploading}>
              {isUploading ? "Uploading..." : "Update Meal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

