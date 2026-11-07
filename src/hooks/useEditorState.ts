import { useState } from 'react'

type Editor<T> = { mode: 'add' } | { mode: 'edit'; item: T } | null

/**
 * Stato condiviso dalle liste modificabili (libretto, esami futuri):
 * finestra di aggiunta/modifica, "salva e aggiungi un altro" e conferma di eliminazione.
 */
export function useEditorState<T extends { id: string }>() {
  const [editor, setEditor] = useState<Editor<T>>(null)
  const [addCount, setAddCount] = useState(0)
  const [notice, setNotice] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<T | null>(null)

  const editing = editor?.mode === 'edit' ? editor.item : undefined

  return {
    isOpen: editor !== null,
    /** Elemento in modifica, `undefined` in aggiunta */
    editing,
    /** Chiave del modulo: cambiandola il modulo riparte vuoto */
    formKey: editing ? editing.id : `new-${addCount}`,
    /** Conferma dopo "salva e aggiungi un altro" (solo in aggiunta) */
    notice: editor?.mode === 'add' ? notice : null,
    openAdd: () => {
      setNotice(null)
      setEditor({ mode: 'add' })
    },
    openEdit: (item: T) => setEditor({ mode: 'edit', item }),
    close: () => {
      setEditor(null)
      setNotice(null)
    },
    /** Dopo un salvataggio con "aggiungi un altro": svuota il modulo e mostra la conferma */
    addedAnother: (message: string) => {
      setNotice(message)
      setAddCount((n) => n + 1)
    },
    toDelete,
    askDelete: (item: T) => setToDelete(item),
    cancelDelete: () => setToDelete(null),
  }
}
