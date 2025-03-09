import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

interface DeleteConfirmationProps {
  itemName: string
  onConfirm: () => void
  onCancel: () => void
}

export default function DeleteConfirmation({ itemName, onConfirm, onCancel }: DeleteConfirmationProps) {
  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {itemName}</DialogTitle>
        </DialogHeader>
        <p>Are you sure you want to delete {itemName}? This action cannot be undone.</p>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

