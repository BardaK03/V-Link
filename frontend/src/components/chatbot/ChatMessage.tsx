interface ChatMessageProps {
  role: 'user' | 'model'
  text: string
}

export function ChatMessage({ role, text }: ChatMessageProps) {
  const isUser = role === 'user'

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: '12px',
      }}
    >
      {!isUser && (
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'var(--vl-orange)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '8px',
            flexShrink: 0,
            fontSize: '14px',
          }}
        >
          🤖
        </div>
      )}
      <div
        style={{
          maxWidth: '78%',
          padding: '10px 14px',
          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          background: isUser ? 'var(--vl-orange)' : 'var(--vl-surface-raised)',
          color: isUser ? '#fff' : 'var(--vl-dark)',
          fontSize: '14px',
          lineHeight: '1.5',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          boxShadow: 'var(--vl-shadow-sm)',
        }}
      >
        {text}
      </div>
    </div>
  )
}
