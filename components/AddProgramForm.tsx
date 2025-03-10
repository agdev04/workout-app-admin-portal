"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { uploadImage } from "@/lib/uploadImage"
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch"
import { GripVertical, Plus, X, ChevronUp, ChevronDown } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface Exercise {
  id: number
  name: string
  description: string
}

interface DayExercise {
  exercise_id: number
  exercise?: Exercise
  day_number: number
  position: number
  reps?: number
  duration_seconds?: number
  rest_seconds: number
}

interface ProgramDay {
  day_number: number
  exercises: DayExercise[]
}

interface ProgramWeek {
  name: string
  week_number: number
  days: ProgramDay[]
}

interface AddProgramFormProps {
  onSubmit: (program: { name: string; description: string; image_url: string; total_weeks: number }) => void
  onCancel: () => void
}

export default function AddProgramForm({ onSubmit, onCancel }: AddProgramFormProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [weeks, setWeeks] = useState<ProgramWeek[]>([])
  const [newWeekName, setNewWeekName] = useState("")
  const [draggedWeekNumber, setDraggedWeekNumber] = useState<number | null>(null)
  const [editingWeekNumber, setEditingWeekNumber] = useState<number | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>("")
  const [exerciseType, setExerciseType] = useState<"reps" | "duration">("reps")
  const [reps, setReps] = useState("")
  const [duration, setDuration] = useState("")
  const [restSeconds, setRestSeconds] = useState("")
  const { authFetch } = useAuthenticatedFetch()
  const [expandedWeeks, setExpandedWeeks] = useState<number[]>([])
  const [expandedDays, setExpandedDays] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    fetchExercises()
  }, [])

  const fetchExercises = async () => {
    try {
      const response = await authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/exercises`)
      if (Array.isArray(response.data)) {
        setExercises(response.data)
      }
    } catch (error) {
      console.error("Error fetching exercises:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUploading(true)

    let image_url = ""
    if (thumbnailFile) {
      try {
        image_url = await uploadImage(thumbnailFile, "program_thumbnails")
      } catch (error) {
        console.error("Error uploading file:", error)
        setIsUploading(false)
        return
      }
    }

    try {
      // Create program
      const programResponse = await authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/programmes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          image_url,
          total_weeks: weeks.length,
        }),
      })

      const newProgramId = programResponse.data.id

      // Add program weeks and their exercises
      for (const week of weeks) {
        const weekResponse = await authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/programmes/weeks`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            programme_id: newProgramId,
            name: week.name,
            week_number: week.week_number,
          }),
        })

        const weekId = weekResponse.data.id

        // Add exercises for each day in the week
        for (const day of week.days) {
          for (const exercise of day.exercises) {
            await authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/programmes/exercises`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                programme_week_id: weekId,
                exercise_id: exercise.exercise_id,
                day_number: day.day_number,
                position: exercise.position,
                reps: exercise.reps,
                duration_seconds: exercise.duration_seconds,
                rest_seconds: exercise.rest_seconds,
              }),
            })
          }
        }
      }

      onSubmit({ name, description, image_url, total_weeks: weeks.length })
    } catch (error) {
      console.error("Error adding program:", error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setThumbnailFile(e.target.files[0])
    }
  }

  const addWeek = () => {
    if (newWeekName.trim()) {
      const maxWeekNumber = Math.max(0, ...weeks.map((w) => w.week_number))
      const newWeek: ProgramWeek = {
        name: newWeekName.trim(),
        week_number: maxWeekNumber + 1,
        days: [],
      }
      setWeeks([...weeks, newWeek])
      setNewWeekName("")
    }
  }

  const removeWeek = (weekNumber: number) => {
    const updatedWeeks = weeks
      .filter((week) => week.week_number !== weekNumber)
      .map((week) => ({
        ...week,
        week_number: week.week_number > weekNumber ? week.week_number - 1 : week.week_number,
      }))
    setWeeks(updatedWeeks)
  }

  const addDay = (weekNumber: number) => {
    const week = weeks.find((w) => w.week_number === weekNumber)
    if (!week) return

    const maxDayNumber = Math.max(0, ...week.days.map((d) => d.day_number))
    const newDay: ProgramDay = {
      day_number: maxDayNumber + 1,
      exercises: [],
    }

    const updatedWeeks = weeks.map((w) =>
      w.week_number === weekNumber
        ? {
            ...w,
            days: [...w.days, newDay],
          }
        : w,
    )
    setWeeks(updatedWeeks)
  }

  const removeDay = (weekNumber: number, dayNumber: number) => {
    const updatedWeeks = weeks.map((week) => {
      if (week.week_number !== weekNumber) return week

      const updatedDays = week.days
        .filter((day) => day.day_number !== dayNumber)
        .map((day) => ({
          ...day,
          day_number: day.day_number > dayNumber ? day.day_number - 1 : day.day_number,
        }))

      return {
        ...week,
        days: updatedDays,
      }
    })

    setWeeks(updatedWeeks)
  }

  const addExerciseToDay = (weekNumber: number, dayNumber: number) => {
    if (!selectedExerciseId || !restSeconds) return

    const exercise = exercises.find((e) => e.id === Number(selectedExerciseId))
    if (!exercise) return

    const updatedWeeks = weeks.map((week) => {
      if (week.week_number !== weekNumber) return week

      const updatedDays = week.days.map((day) => {
        if (day.day_number !== dayNumber) return day

        const maxPosition = Math.max(0, ...day.exercises.map((e) => e.position))
        const newExercise: DayExercise = {
          exercise_id: exercise.id,
          exercise,
          day_number: dayNumber,
          position: maxPosition + 1,
          rest_seconds: Number(restSeconds),
        }

        if (exerciseType === "reps" && reps) {
          newExercise.reps = Number(reps)
        } else if (exerciseType === "duration" && duration) {
          newExercise.duration_seconds = Number(duration)
        }

        return {
          ...day,
          exercises: [...day.exercises, newExercise],
        }
      })

      return {
        ...week,
        days: updatedDays,
      }
    })

    setWeeks(updatedWeeks)
    setSelectedExerciseId("")
    setReps("")
    setDuration("")
    setRestSeconds("")
  }

  const removeExercise = (weekNumber: number, dayNumber: number, position: number) => {
    const updatedWeeks = weeks.map((week) => {
      if (week.week_number !== weekNumber) return week

      const updatedDays = week.days.map((day) => {
        if (day.day_number !== dayNumber) return day

        const updatedExercises = day.exercises
          .filter((exercise) => exercise.position !== position)
          .map((exercise) => ({
            ...exercise,
            position: exercise.position > position ? exercise.position - 1 : exercise.position,
          }))

        return {
          ...day,
          exercises: updatedExercises,
        }
      })

      return {
        ...week,
        days: updatedDays,
      }
    })

    setWeeks(updatedWeeks)
  }

  const handleDragStart = (weekNumber: number) => {
    setDraggedWeekNumber(weekNumber)
  }

  const handleDragOver = (e: React.DragEvent, targetWeekNumber: number) => {
    e.preventDefault()
    if (draggedWeekNumber === null || draggedWeekNumber === targetWeekNumber) return

    const draggedWeek = weeks.find((w) => w.week_number === draggedWeekNumber)
    if (!draggedWeek) return

    const updatedWeeks = weeks.map((week) => {
      if (week.week_number === draggedWeekNumber) {
        return { ...week, week_number: targetWeekNumber }
      }
      if (draggedWeekNumber < targetWeekNumber) {
        if (week.week_number > draggedWeekNumber && week.week_number <= targetWeekNumber) {
          return { ...week, week_number: week.week_number - 1 }
        }
      } else {
        if (week.week_number >= targetWeekNumber && week.week_number < draggedWeekNumber) {
          return { ...week, week_number: week.week_number + 1 }
        }
      }
      return week
    })

    setWeeks(updatedWeeks)
    setDraggedWeekNumber(targetWeekNumber)
  }

  const handleDragEnd = () => {
    setDraggedWeekNumber(null)
  }

  const toggleWeekExpansion = (weekNumber: number) => {
    setExpandedWeeks((current) =>
      current.includes(weekNumber) ? current.filter((w) => w !== weekNumber) : [...current, weekNumber],
    )
  }

  const toggleDayExpansion = (weekNumber: number, dayNumber: number) => {
    const key = `${weekNumber}-${dayNumber}`
    setExpandedDays((current) => ({
      ...current,
      [key]: !current[key],
    }))
  }

  // Sort weeks by week_number for display
  const sortedWeeks = [...weeks].sort((a, b) => a.week_number - b.week_number)

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Add Program</DialogTitle>
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
              <Label htmlFor="thumbnail">Thumbnail</Label>
              <Input id="thumbnail" type="file" onChange={handleFileChange} accept="image/*" required />
            </div>
            <div>
              <Label>Total Weeks</Label>
              <Input value={weeks.length} disabled className="bg-muted" />
            </div>
            <div className="border-t pt-4">
              <Label>Program Weeks</Label>
              <div className="space-y-4 mt-2">
                {sortedWeeks.map((week) => (
                  <div key={week.week_number} className="space-y-2">
                    <div
                      className="flex items-center gap-2 bg-muted/50 p-2 rounded-md"
                      draggable
                      onDragStart={() => handleDragStart(week.week_number)}
                      onDragOver={(e) => handleDragOver(e, week.week_number)}
                      onDragEnd={handleDragEnd}
                    >
                      <Button type="button" variant="ghost" size="sm" className="cursor-grab active:cursor-grabbing">
                        <GripVertical className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault()
                          toggleWeekExpansion(week.week_number)
                        }}
                      >
                        {expandedWeeks.includes(week.week_number) ? "-" : "+"}
                      </Button>
                      <span className="font-medium">Week {week.week_number}:</span>
                      {editingWeekNumber === week.week_number ? (
                        <Input
                          className="flex-1"
                          value={week.name}
                          onChange={(e) => {
                            const updatedWeeks = weeks.map((w) =>
                              w.week_number === week.week_number ? { ...w, name: e.target.value } : w,
                            )
                            setWeeks(updatedWeeks)
                          }}
                          onBlur={() => setEditingWeekNumber(null)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              setEditingWeekNumber(null)
                            }
                          }}
                          autoFocus
                        />
                      ) : (
                        <span className="flex-1" onDoubleClick={() => setEditingWeekNumber(week.week_number)}>
                          {week.name}
                        </span>
                      )}
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeWeek(week.week_number)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    {expandedWeeks.includes(week.week_number) && (
                      <div className="pl-8 space-y-2">
                        {week.days.map((day) => (
                          <div key={day.day_number} className="space-y-2">
                            <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-md">
                              <span className="font-medium">Day {day.day_number}</span>
                              <span className="text-sm text-muted-foreground">({day.exercises.length} exercises)</span>
                              <div className="flex-1" />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeDay(week.week_number, day.day_number)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleDayExpansion(week.week_number, day.day_number)}
                              >
                                {expandedDays[`${week.week_number}-${day.day_number}`] ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </div>

                            {expandedDays[`${week.week_number}-${day.day_number}`] && (
                              <div className="pl-4 space-y-2">
                                {/* Exercises in the day */}
                                <div className="pl-4 space-y-2">
                                  {day.exercises.map((exercise) => (
                                    <div
                                      key={exercise.position}
                                      className="flex items-center gap-2 p-2 bg-muted/20 rounded-md"
                                    >
                                      <span className="flex-1">{exercise.exercise?.name}</span>
                                      <span className="text-sm text-muted-foreground">
                                        {exercise.reps ? `${exercise.reps} reps` : `${exercise.duration_seconds}s`}
                                      </span>
                                      <span className="text-sm text-muted-foreground">
                                        Rest: {exercise.rest_seconds}s
                                      </span>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          removeExercise(week.week_number, day.day_number, exercise.position)
                                        }
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ))}

                                  {/* Add exercise form */}
                                  <div className="space-y-2 p-2 border rounded-md">
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <Label>Exercise</Label>
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
                                        <Label>Rest (seconds)</Label>
                                        <Input
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
                                          <Label>Number of Reps</Label>
                                          <Input
                                            type="number"
                                            min="1"
                                            value={reps}
                                            onChange={(e) => setReps(e.target.value)}
                                            placeholder="12"
                                          />
                                        </div>
                                      ) : (
                                        <div>
                                          <Label>Duration (seconds)</Label>
                                          <Input
                                            type="number"
                                            min="1"
                                            value={duration}
                                            onChange={(e) => setDuration(e.target.value)}
                                            placeholder="30"
                                          />
                                        </div>
                                      )}
                                    </div>
                                    <Button
                                      type="button"
                                      onClick={() => addExerciseToDay(week.week_number, day.day_number)}
                                      className="w-full"
                                    >
                                      <Plus className="h-4 w-4 mr-2" /> Add Exercise
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addDay(week.week_number)}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" /> Add Day
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Enter week name..."
                    value={newWeekName}
                    onChange={(e) => setNewWeekName(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="button" onClick={addWeek}>
                    <Plus className="h-4 w-4 mr-2" /> Add Week
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUploading || weeks.length === 0}>
              {isUploading ? "Uploading..." : "Add Program"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

