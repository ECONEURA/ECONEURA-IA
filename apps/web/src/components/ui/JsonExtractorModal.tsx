import React, { useEffect, useRef, useState } from 'react'

interface JsonExtractorModalProps {
  open: boolean
  initialText?: string
  title?: string
  onSubmit: (text: string) => void
  onClose: () => void
}

export function JsonExtractorModal({ open, initialText = '', title = 'Extraer JSON', onSubmit, onClose }: JsonExtractorModalProps) {
  const [text, setText] = useState(initialText)
  const dialogRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (open) {
      setText(initialText)
      setTimeout(() => textareaRef.current?.focus(), 0)
    }
  }, [open, initialText])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }

  const handleSubmit = () => onSubmit(text)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="json-extractor-title"
      ref={dialogRef}
    >
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6" role="document">
        <h3 id="json-extractor-title" className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600 mt-1">Pega el texto y extraeremos el JSON.</p>
        <textarea
          ref={textareaRef}
          className="mt-4 w-full h-48 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-mediterranean-500"
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label="Texto a procesar"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button className="px-3 py-2 text-sm rounded-lg text-gray-700 hover:bg-gray-100" onClick={onClose}>
            Cancelar
          </button>
          <button className="px-3 py-2 text-sm rounded-lg bg-mediterranean-600 text-white hover:opacity-90" onClick={handleSubmit}>
            Extraer
          </button>
        </div>
      </div>
    </div>
  )
}

export default JsonExtractorModal

