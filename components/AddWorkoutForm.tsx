"use client"

import type React from "react"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch"
import { GripVertical, Plus, X } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { uploadImage } from "@/lib/uploadImage"

const difficultyLevels = ["beginner", "intermediate", "advanced", "expert"]

interface Exercise {
  id: number
  name: string
  thumbnail_url?: string
}

interface WorkoutExercise {
  exercise_id: number
  exercise?: Exercise
  reps?: number
  duration_seconds?: number
  rest_seconds: number
  position: number
  sets_number: number
}

interface AddWorkoutFormProps {
  onSubmit: (workout: { name: string; description: string; thumbnail_url: string; difficulty: string }) => void
  onCancel: () => void
}

export default function AddWorkoutForm({ onSubmit, onCancel }: AddWorkoutFormProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [difficulty, setDifficulty] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([])
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>("")
  const [exerciseType, setExerciseType] = useState<"reps" | "duration">("reps")
  const [reps, setReps] = useState("")
  const [duration, setDuration] = useState("")
  const [restSeconds, setRestSeconds] = useState("")
  const [draggedExerciseIndex, setDraggedExerciseIndex] = useState<number | null>(null)
  const { authFetch } = useAuthenticatedFetch()

  const fetchExercises = useCallback(async () => {
    try {
      const response = await authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/exercises`)
      if (Array.isArray(response.data)) {
        setExercises(response.data)
      }
    } catch (error) {
      console.error("Error fetching exercises:", error)
    }
  }, [authFetch])

  useEffect(() => {
    let mounted = true
    
    const loadExercises = async () => {
      if (mounted) {
        await fetchExercises()
      }
    }
    
    loadExercises()
    
    return () => {
      mounted = false
    }
  }, [fetchExercises])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUploading(true)

    let thumbnail_url = ""
    if (thumbnailFile) {
      try {
        thumbnail_url = await uploadImage(thumbnailFile, "workout_thumbnails")
      } catch (error) {
        console.error("Error uploading file:", error)
        setIsUploading(false)
        return
      }
    }

    try {
      const workoutResponse = await authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/workouts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          thumbnail_url,
          difficulty,
        }),
      })

      const newWorkoutId = workoutResponse.data.id

      await Promise.all(
        workoutExercises.map((exercise) =>
          authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/workouts/exercises`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              workout_id: newWorkoutId,
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

      onSubmit(workoutResponse.data)
    } catch (error) {
      console.error("Error adding workout:", error)
    } finally {
      setIsUploading(false)
    }
  }, [thumbnailFile, name, description, difficulty, workoutExercises, authFetch, onSubmit])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setThumbnailFile(e.target.files[0])
    }
  }, [])

  const [sets, setSets] = useState("")

  const addExercise = useCallback(() => {
    if (!selectedExerciseId || !restSeconds || !sets) return

    const exercise = exercises.find((e) => e.id === Number(selectedExerciseId))
    if (!exercise) return

    const newExercise: WorkoutExercise = {
      exercise_id: exercise.id,
      exercise,
      rest_seconds: Number(restSeconds),
      position: workoutExercises.length + 1,
      sets_number: Number(sets),
    }

    if (exerciseType === "reps" && reps) {
      newExercise.reps = Number(reps)
    } else if (exerciseType === "duration" && duration) {
      newExercise.duration_seconds = Number(duration)
    } else {
      return
    }

    setWorkoutExercises((prev) => [...prev, newExercise])
    setSelectedExerciseId("")
    setReps("")
    setDuration("")
    setRestSeconds("")
  }, [selectedExerciseId, restSeconds, exercises, workoutExercises.length, exerciseType, reps, duration])

  const removeExercise = useCallback((index: number) => {
    setWorkoutExercises((prev) => {
      const updated = prev
        .filter((_, i) => i !== index)
        .map((exercise, i) => ({
          ...exercise,
          position: i + 1,
        }))
      return updated
    })
  }, [])

  const handleDragStart = useCallback((index: number) => {
    setDraggedExerciseIndex(index)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedExerciseIndex === null) return

    const draggedExercise = workoutExercises[draggedExerciseIndex]
    if (!draggedExercise) return

    setWorkoutExercises((prev) => {
      const newExercises = [...prev]
      newExercises.splice(draggedExerciseIndex, 1)
      newExercises.splice(index, 0, draggedExercise)

      return newExercises.map((exercise, i) => ({
        ...exercise,
        position: i + 1,
      }))
    })
    
    setDraggedExerciseIndex(index)
  }, [draggedExerciseIndex, workoutExercises])

  const handleDragEnd = () => {
    setDraggedExerciseIndex(null)
  }

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Add Workout</DialogTitle>
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
              <Input id="thumbnail" type="file" onChange={handleFileChange} accept="image/*" required />
            </div>
            <div className="border-t pt-4">
              <Label>Exercises</Label>
              <div className="space-y-4 mt-2">
                {workoutExercises.map((workoutExercise, index) => (
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
                          {exercises.map((exercise) => (
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
                        required
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
              {isUploading ? "Uploading..." : "Add Workout"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

