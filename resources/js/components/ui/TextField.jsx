import { useState } from 'react';
import { IconEye, IconEyeOff } from '../layout/Icons';

export default function TextField({ label, id, error, hint, className = '', type = 'text', ...props }) {
  const [motDePasseVisible, setMotDePasseVisible] = useState(false);
  const estMotDePasse = type === 'password';
  const typeEffectif = estMotDePasse && motDePasseVisible ? 'text' : type;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-ink900/80 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          type={typeEffectif}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={`w-full rounded-lg border bg-surface px-3.5 py-2.5 text-sm font-sans
            placeholder:text-ink900/35 transition-colors
            ${estMotDePasse ? 'pr-10' : ''}
            ${error ? 'border-danger' : 'border-ink900/15 focus:border-indigo-600'}
            focus:outline-none focus:ring-2 focus:ring-offset-0
            ${error ? 'focus:ring-danger/20' : 'focus:ring-indigo-600/20'}`}
          {...props}
        />
        {estMotDePasse && (
          <button
            type="button"
            onClick={() => setMotDePasseVisible((v) => !v)}
            tabIndex={-1}
            aria-label={motDePasseVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink900/40 hover:text-ink900/70 transition-colors"
          >
            {motDePasseVisible ? <IconEyeOff /> : <IconEye />}
          </button>
        )}
      </div>
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