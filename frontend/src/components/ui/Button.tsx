interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const base = [
    'inline-flex items-center justify-center font-medium rounded-lg',
    'transition-all duration-150 cursor-pointer',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'focus-visible:outline-2 focus-visible:outline-offset-2',
  ].join(' ')

  const sizes = {
    sm:  'px-3 py-1.5 text-sm gap-1.5',
    md:  'px-4 py-2 text-sm gap-2',
    lg:  'px-6 py-3 text-base gap-2',
  }

  const variants = {
    primary:   'bg-[var(--vl-orange)] text-white hover:bg-[var(--vl-orange-hover)] shadow-sm active:scale-[0.98]',
    secondary: 'bg-[var(--vl-surface-raised)] text-[var(--vl-text)] border border-[var(--vl-border)] hover:bg-[var(--vl-border)] active:scale-[0.98]',
    danger:    'bg-[var(--vl-error)] text-white hover:opacity-90 shadow-sm active:scale-[0.98]',
    ghost:     'text-[var(--vl-muted)] hover:text-[var(--vl-text)] hover:bg-[var(--vl-surface-raised)]',
  }

  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <>
          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Se procesează...
        </>
      ) : children}
    </button>
  )
}
