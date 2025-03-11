"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Image from "next/image"
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch"
import { GripVertical, Plus, X } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

import { uploadImage } from "@/lib/uploadImage"

const difficultyLevels = ["beginner", "intermediate", "advanced", "expert"]

interface Exercise {
  id: number
  name: string
  description: string
  thumbnail_url: string
  is_active: boolean
}

interface WorkoutExercise {
  id?: number
  exercise_id: number
  exercise?: Exercise
  reps?: number | null
  duration_seconds?: number | null
  rest_seconds: number
  position: number
  workout_id?: number
  sets_number: number
}

interface Workout {
  id: number
  name: string
  description: string
  thumbnail_url: string
  difficulty: string
  exercises?: WorkoutExercise[]
}

interface EditWorkoutFormProps {
  workout: Workout
  onSubmit: (workout: Workout) => void
  onCancel: () => void
}

export default function EditWorkoutForm({ workout, onSubmit, onCancel }: EditWorkoutFormProps) {
  const [name, setName] = useState(workout.name)
  const [description, setDescription] = useState(workout.description)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailUrl, setThumbnailUrl] = useState(workout.thumbnail_url)
  const [difficulty, setDifficulty] = useState(workout.difficulty)
  const [isUploading, setIsUploading] = useState(false)
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([])
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>(workout.exercises || [])
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>("")
  const [exerciseType, setExerciseType] = useState<"reps" | "duration">("reps")
  const [reps, setReps] = useState("")
  const [duration, setDuration] = useState("")
  const [restSeconds, setRestSeconds] = useState("")
  const [draggedExerciseIndex, setDraggedExerciseIndex] = useState<number | null>(null)
  const [sets, setSets] = useState("")
  const { authFetch } = useAuthenticatedFetch()
  const [originalExercises] = useState<WorkoutExercise[]>(workout.exercises || [])

  useEffect(() => {
    fetchExercises()
  }, [])

  const fetchExercises = async () => {
    try {
      const response = await authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/exercises`)
      if (Array.isArray(response.data)) {
        setAvailableExercises(response.data)
      }
    } catch (error) {
      console.error("Error fetching exercises:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUploading(true)

    let new_thumbnail_url = thumbnailUrl
    if (thumbnailFile) {
      try {
        new_thumbnail_url = await uploadImage(thumbnailFile, "workout_thumbnails")
      } catch (error) {
        console.error("Error uploading file:", error)
        setIsUploading(false)
        return
      }
    }

    try {
      // Update workout basic info
      const updatedWorkout = {
        ...workout,
        name,
        description,
        thumbnail_url: new_thumbnail_url,
        difficulty,
      }

      await authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/workouts/${workout.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedWorkout),
      })

      // Delete all existing exercises
      await Promise.all(
        originalExercises.map((exercise) =>
          exercise.id
            ? authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/workouts/exercises/${exercise.id}`, {
                method: "DELETE",
              })
            : Promise.resolve(),
        ),
      )

      // Add all exercises in their new positions
      await Promise.all(
        workoutExercises.map((exercise) =>
          authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/workouts/exercises`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              workout_id: workout.id,
              exercise_id: exercise.exercise_id,
              reps: exercise.reps,
              duration_seconds: exercise.duration_seconds,
              rest_seconds: exercise.rest_seconds,
              position: exercise.position,
              sets_number: exercise.sets_number,
            }),
          }),
        ),
      )

      updatedWorkout.exercises = workoutExercises
      onSubmit(updatedWorkout)
    } catch (error) {
      console.error("Error updating workout:", error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setThumbnailFile(e.target.files[0])
    }
  }

  const addExercise = () => {
    if (!selectedExerciseId || !restSeconds || !sets) return

    const exercise = availableExercises.find((e) => e.id === Number(selectedExerciseId))
    if (!exercise) return

    // Increment positions of existing exercises
    const updatedExercises = workoutExercises.map((ex) => ({
      ...ex,
      position: ex.position + 1,
    }))

    const newExercise: WorkoutExercise = {
      exercise_id: exercise.id,
      exercise,
      rest_seconds: Number(restSeconds),
      position: 1, // New exercise always goes to the top
      sets_number: Number(sets)
    }

    if (exerciseType === "reps" && reps) {
      newExercise.reps = Number(reps)
      newExercise.duration_seconds = null
    } else if (exerciseType === "duration" && duration) {
      newExercise.duration_seconds = Number(duration)
      newExercise.reps = null
    } else {
      return
    }

    setWorkoutExercises([newExercise, ...updatedExercises])
    setSelectedExerciseId("")
    setReps("")
    setDuration("")
    setRestSeconds("")
    setSets("")
  }

  const removeExercise = (index: number) => {
    const removedPosition = workoutExercises[index].position
    const updatedExercises = workoutExercises
      .filter((_, i) => i !== index)
      .map((exercise) => ({
        ...exercise,
        position: exercise.position > removedPosition ? exercise.position - 1 : exercise.position,
      }))
    setWorkoutExercises(updatedExercises)
  }

  const handleDragStart = (index: number) => {
    setDraggedExerciseIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedExerciseIndex === null) return

    const draggedExercise = workoutExercises[draggedExerciseIndex]
    if (!draggedExercise) return

    const newExercises = [...workoutExercises]
    newExercises.splice(draggedExerciseIndex, 1)
    newExercises.splice(index, 0, draggedExercise)

    // Update positions - lower numbers at top
    const updatedExercises = newExercises.map((exercise, i) => ({
      ...exercise,
      position: i + 1,
    }))

    setWorkoutExercises(updatedExercises)
    setDraggedExerciseIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedExerciseIndex(null)
  }

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Edit Workout</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 overflow-y-auto max-h-[calc(80vh-8rem)]">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select value={difficulty} onValueChange={setDifficulty} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty level" />
                </SelectTrigger>
                <SelectContent>
                  {difficultyLevels.map((level) => (
                    <SelectItem key={level} value={level}>
                      <span className="capitalize">{level}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="thumbnail">Thumbnail</Label>
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
              <Input id="thumbnail" type="file" onChange={handleFileChange} accept="image/*" />
            </div>
            <div className="border-t pt-4">
              <Label>Exercises</Label>
              <div className="space-y-4 mt-2">
                {workoutExercises
                  .sort((a, b) => a.position - b.position)
                  .map((workoutExercise, index) => (
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
                      <span className="font-medium">{workoutExercise.position}.</span>
                      <span className="flex-1">{workoutExercise.exercise?.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {workoutExercise.reps ? `${workoutExercise.reps} reps` : `${workoutExercise.duration_seconds}s`} × {workoutExercise.sets_number} sets
                      </span>
                      <span className="text-sm text-muted-foreground">Rest: {workoutExercise.rest_seconds}s</span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeExercise(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <Label htmlFor="exercise">Exercise</Label>
                      <Select value={selectedExerciseId} onValueChange={setSelectedExerciseId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select exercise" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableExercises.map((exercise) => (
                            <SelectItem key={exercise.id} value={exercise.id.toString()}>
                              {exercise.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="sets">Sets</Label>
                      <Input
                        id="sets"
                        type="number"
                        min="1"
                        value={sets}
                        onChange={(e) => setSets(e.target.value)}
                        placeholder="3"
                      />
                    </div>
                    <div className="col-span-3">
                      <Label htmlFor="rest">Rest (seconds)</Label>
                      <Input
                        id="rest"
                        type="number"
                        min="0"
                        value={restSeconds}
                        onChange={(e) => setRestSeconds(e.target.value)}
                        placeholder="60"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Type</Label>
                    <RadioGroup
                      value={exerciseType}
                      onValueChange={(value) => setExerciseType(value as "reps" | "duration")}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="reps" id="reps" />
                        <Label htmlFor="reps">Reps</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="duration" id="duration" />
                        <Label htmlFor="duration">Duration</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div>
                    {exerciseType === "reps" ? (
                      <div>
                        <Label htmlFor="reps">Number of Reps</Label>
                        <Input
                          id="reps"
                          type="number"
                          min="1"
                          value={reps}
                          onChange={(e) => setReps(e.target.value)}
                          placeholder="12"
                        />
                      </div>
                    ) : (
                      <div>
                        <Label htmlFor="duration">Duration (seconds)</Label>
                        <Input
                          id="duration"
                          type="number"
                          min="1"
                          value={duration}
                          onChange={(e) => setDuration(e.target.value)}
                          placeholder="30"
                        />
                      </div>
                    )}
                  </div>
                  <Button type="button" onClick={addExercise} className="w-full">
                    <Plus className="h-4 w-4 mr-2" /> Add Exercise
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUploading}>
              {isUploading ? "Uploading..." : "Update Workout"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

