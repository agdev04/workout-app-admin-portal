import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type Field = {
  name: string
  label: string
  type: "text" | "textarea" | "number"
}

type AddItemFormProps = {
  title: string
  fields: Field[]
  onSubmit: (data: Record<string, string>) => void
}

const AddItemForm = ({ title, fields, onSubmit }: AddItemFormProps) => {
  const [formData, setFormData] = useState<Record<string, string>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    setFormData({})
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-2xl font-bold text-primary">{title}</h2>
      {fields.map((field) => (
        <div key={field.name}>
          <Label htmlFor={field.name} className="text-secondary">
            {field.label}
          </Label>
          {field.type === "textarea" ? (
            <Textarea
              id={field.name}
              name={field.name}
              value={formData[field.name] || ""}
              onChange={handleChange}
              className="w-full border-secondary focus:border-primary focus:ring-primary"
            />
          ) : (
            <Input
              type={field.type}
              id={field.name}
              name={field.name}
              value={formData[field.name] || ""}
              onChange={handleChange}
              className="w-full border-secondary focus:border-primary focus:ring-primary"
            />
          )}
        </div>
      ))}
      <Button type="submit" className="bg-primary hover:bg-primary-dark text-white">
        Add {title}
      </Button>
    </form>
  )
}

export default AddItemForm

