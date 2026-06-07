'use client'

import { useState, useCallback } from 'react'
import { sendChatMessage } from '@/lib/api'

export interface ChatMessage {
  role: 'user' | 'model'
  text: string
}

export function useChatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return

    const userMsg: ChatMessage = { role: 'user', text }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setLoading(true)
    setError(null)

    try {
      const history = messages.map((m) => ({ role: m.role, parts: m.text }))
      const { reply } = await sendChatMessage(text, history)
      setMessages([...nextMessages, { role: 'model', text: reply }])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eroare la trimiterea mesajului')
      setMessages(nextMessages)
    } finally {
      setLoading(false)
    }
  }, [messages, loading])

  const reset = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  return { messages, loading, error, sendMessage, reset }
}
