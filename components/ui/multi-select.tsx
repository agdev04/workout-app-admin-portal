"use client"

import * as React from "react"
import { X, Plus } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch"
import { useState } from "react"
import { Trash2 } from "lucide-react"

export type Option = {
  value: string | number
  label: string
}

type MultiSelectProps = {
  options: Option[]
  selected: Option[]
  onChange: (options: Option[]) => void
  className?: string
  onAddNewOption?: (updatedOptions: Option[]) => void
  type: "category" | "bodyPart" | "equipment"
  onDeleteOption?: (option: Option) => void
}

export function MultiSelect({
  options,
  selected,
  onChange,
  className,
  onAddNewOption,
  type,
  onDeleteOption,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [newOptionName, setNewOptionName] = React.useState("")
  const [error, setError] = useState<string | null>(null)
  const { authFetch } = useAuthenticatedFetch()

  const handleUnselect = (option: Option) => {
    onChange(selected.filter((item) => item.value !== option.value))
  }

  const getApiEndpoint = () => {
    switch (type) {
      case "category":
        return "categories"
      case "bodyPart":
        return "body-parts"
      case "equipment":
        return "equipment"
      default:
        console.error(`Unsupported type: ${type}`)
        return "categories" // fallback to categories
    }
  }

  const getPlaceholderText = (type: string) => {
    switch (type) {
      case "category":
        return "Select categories..."
      case "bodyPart":
        return "Select body parts..."
      case "equipment":
        return "Select equipment..."
      default:
        return "Select options..."
    }
  }

  const handleAddNewOption = async () => {
    if (newOptionName.trim() === "") return
    if (!["category", "bodyPart", "equipment"].includes(type)) {
      setError(`Invalid type: ${type}`)
      return
    }

    try {
      const endpoint = getApiEndpoint()
      const response = await authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newOptionName }),
      })

      if (!response || response.status !== "success") {
        throw new Error("Invalid response from server")
      }

      const updatedResponse = await authFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/${endpoint}`, {
        method: "GET",
      })

      if (updatedResponse && updatedResponse.status === "success" && Array.isArray(updatedResponse.data)) {
        const updatedOptions = updatedResponse.data.map((item: any) => ({
          value: item.id,
          label: item.name,
        }))
        if (onAddNewOption) {
          onAddNewOption(updatedOptions)
        }
      } else {
        throw new Error(`Failed to fetch updated ${type} list`)
      }

      setNewOptionName("")
      setError(null)
    } catch (error) {
      console.error(`Error adding new ${type}:`, error)
      setError(error instanceof Error ? error.message : `Failed to add new ${type}. Please try again.`)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={`w-full justify-between ${selected.length > 0 ? "h-full min-h-10" : "h-10"} ${className}`}
        >
          <div className="flex gap-1 flex-wrap">
            {selected.length > 0
              ? selected.map((option) => (
                  <Badge variant="secondary" key={option.value} className="mr-1 mb-1 text-white">
                    {option.label}
                    <span
                      className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleUnselect(option)
                        }
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                      onClick={() => handleUnselect(option)}
                      role="button"
                      tabIndex={0}
                      aria-label={`Remove ${option.label}`}
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </span>
                  </Badge>
                ))
              : getPlaceholderText(type)}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder={`Search ${type}...`} className="h-9" />
          <CommandList className="max-h-[200px] overflow-hidden">
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup className="overflow-y-auto">
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => {
                    onChange(
                      selected.some((item) => item.value === option.value)
                        ? selected.filter((item) => item.value !== option.value)
                        : [...selected, option],
                    )
                    setOpen(true)
                  }}
                  className="flex items-center justify-between gap-2 px-2 py-1"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-4 w-4 items-center justify-center rounded border border-primary">
                      {selected.some((item) => item.value === option.value) && <X className="h-3 w-3 text-primary" />}
                    </div>
                    <span>{option.label}</span>
                  </div>
                  {onDeleteOption && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteOption(option)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          <div className="flex items-center gap-2 border-t p-2">
            <Input
              placeholder={`New ${type} name`}
              value={newOptionName}
              onChange={(e) => setNewOptionName(e.target.value)}
              className="flex-1 h-8"
            />
            <Button type="button" onClick={handleAddNewOption} size="sm" className="h-8 px-3">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
          {error && <div className="px-2 pb-2 text-sm text-red-500">{error}</div>}
        </Command>
      </PopoverContent>
    </Popover>
  )
}

