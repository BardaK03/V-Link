'use client'

import { useState, KeyboardEvent } from 'react'

interface ChatInputProps {
  onSend: (text: string) => void
  disabled: boolean
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState('')

  const handleSend = () => {
    if (!value.trim() || disabled) return
    onSend(value.trim())
    setValue('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        padding: '12px 16px',
        borderTop: '1px solid var(--vl-border)',
        background: 'var(--vl-surface)',
      }}
    >
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Întreabă-mă despre voluntariat..."
        disabled={disabled}
        rows={1}
        style={{
          flex: 1,
          resize: 'none',
          border: '1px solid var(--vl-border)',
          borderRadius: '8px',
          padding: '8px 12px',
          fontSize: '14px',
          fontFamily: 'var(--vl-font-body)',
          color: 'var(--vl-dark)',
          background: 'var(--vl-bg)',
          outline: 'none',
          lineHeight: '1.4',
        }}
      />
      <button
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        style={{
          padding: '8px 14px',
          borderRadius: '8px',
          border: 'none',
          background: 'var(--vl-orange)',
          color: '#fff',
          fontSize: '18px',
          cursor: disabled || !value.trim() ? 'not-allowed' : 'pointer',
          opacity: disabled || !value.trim() ? 0.5 : 1,
          transition: 'opacity 0.15s',
          flexShrink: 0,
        }}
        aria-label="Trimite"
      >
        ↑
      </button>
    </div>
  )
}
