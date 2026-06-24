interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
}

export function Input({ label, hint, error, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-[var(--vl-dark)]">
          {label}
        </label>
      )}
      <input
        className={[
          'w-full rounded-lg px-3 py-2.5 text-sm',
          'bg-[var(--vl-surface)] text-[var(--vl-dark)]',
          'placeholder:text-[var(--vl-placeholder)]',
          'border transition-colors duration-150',
          'focus:outline-none focus:ring-2 focus:ring-[var(--vl-orange)] focus:ring-offset-0',
          error
            ? 'border-[var(--vl-error)] focus:ring-red-300'
            : 'border-[var(--vl-border)] hover:border-[var(--vl-border-strong)] focus:border-[var(--vl-orange)]',
          className,
        ].join(' ')}
        {...props}
      />
      {hint && !error && (
        <p className="text-xs text-[var(--vl-muted)]">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-[var(--vl-error)] flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  )
}
