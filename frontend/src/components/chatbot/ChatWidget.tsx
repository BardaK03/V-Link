'use client'

import { useRef, useEffect, useState } from 'react'
import { useChatbot } from '@/hooks/useChatbot'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const { messages, loading, error, sendMessage, reset } = useChatbot()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, open])

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Închide asistentul' : 'Deschide asistentul V-Link'}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: 'var(--vl-orange)',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          fontSize: '22px',
          boxShadow: 'var(--vl-shadow-lg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          transition: 'transform 0.2s, background 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--vl-orange-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--vl-orange)')}
      >
        {open ? '✕' : '🤖'}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          style={{
            position: 'fixed',
            bottom: '88px',
            right: '24px',
            width: '360px',
            height: '500px',
            background: 'var(--vl-surface)',
            borderRadius: 'var(--vl-radius-xl)',
            boxShadow: 'var(--vl-shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 999,
            border: '1px solid var(--vl-border)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 16px',
              background: 'var(--vl-orange)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>🤖</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px', fontFamily: 'var(--vl-font-body)' }}>
                  Asistent V-Link
                </div>
                <div style={{ fontSize: '11px', opacity: 0.85 }}>
                  Recomandări de voluntariat
                </div>
              </div>
            </div>
            <button
              onClick={reset}
              title="Conversație nouă"
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                cursor: 'pointer',
                padding: '4px 8px',
                fontSize: '11px',
                fontFamily: 'var(--vl-font-body)',
              }}
            >
              Resetează
            </button>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {messages.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  color: 'var(--vl-muted)',
                  fontSize: '13px',
                  marginTop: '40px',
                  lineHeight: '1.6',
                  fontFamily: 'var(--vl-font-body)',
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>👋</div>
                <strong style={{ color: 'var(--vl-dark)' }}>Salut! Sunt asistentul V-Link.</strong>
                <br />
                Te pot ajuta să găsești voluntariate potrivite skill-urilor tale sau să afli mai multe despre un eveniment.
              </div>
            )}

            {messages.map((msg, i) => (
              <ChatMessage key={i} role={msg.role} text={msg.text} />
            ))}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'var(--vl-orange)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    flexShrink: 0,
                  }}
                >
                  🤖
                </div>
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '16px 16px 16px 4px',
                    background: 'var(--vl-surface-raised)',
                    fontSize: '18px',
                    letterSpacing: '4px',
                    color: 'var(--vl-muted)',
                  }}
                >
                  •••
                </div>
              </div>
            )}

            {error && (
              <div
                style={{
                  background: 'var(--vl-error-bg)',
                  color: 'var(--vl-error)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '13px',
                  marginBottom: '8px',
                  fontFamily: 'var(--vl-font-body)',
                }}
              >
                {error}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <ChatInput onSend={sendMessage} disabled={loading} />
        </div>
      )}
    </>
  )
}
