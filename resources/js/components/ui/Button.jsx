const VARIANTS = {
    boutique: 'bg-ochre-500 hover:bg-ochre-600 text-white',
    admin: 'bg-gold-500 hover:bg-gold-600 text-ink-950',
    ghost: 'bg-transparent hover:bg-black/5 text-current border border-current/20',
  };
  
  export default function Button({
    variant = 'boutique',
    loading = false,
    children,
    className = '',
    disabled,
    ...props
  }) {
    return (
      <button
        className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5
          font-sans font-medium text-sm transition-colors duration-150
          disabled:opacity-50 disabled:cursor-not-allowed
          ${VARIANTS[variant]} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
        )}
        {children}
      </button>
    );
  }