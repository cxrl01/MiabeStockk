export default function TextField({ label, id, error, hint, className = '', ...props }) {
    return (
      <div className={className}>
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-ink900/80 mb-1.5">
            {label}
          </label>
        )}
        <input
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm font-sans
            placeholder:text-ink900/35 transition-colors
            ${error ? 'border-danger' : 'border-ink900/15 focus:border-indigo-600'}
            focus:outline-none focus:ring-2 focus:ring-offset-0
            ${error ? 'focus:ring-danger/20' : 'focus:ring-indigo-600/20'}`}
          {...props}
        />
        {error && (
          <p id={`${id}-error`} className="mt-1.5 text-sm text-danger">
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={`${id}-hint`} className="mt-1.5 text-sm text-ink900/50">
            {hint}
          </p>
        )}
      </div>
    );
  }