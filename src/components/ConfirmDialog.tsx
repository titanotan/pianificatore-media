import type { ReactNode } from 'react'
import { Button } from './Button'
import { Modal, ModalActions } from './Modal'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: ReactNode
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}

/** Chiede conferma prima di un'azione che non si può annullare (es. eliminare). */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title} description={message} size="sm">
      <ModalActions>
        <Button onClick={onCancel} data-autofocus>
          Annulla
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </ModalActions>
    </Modal>
  )
}
