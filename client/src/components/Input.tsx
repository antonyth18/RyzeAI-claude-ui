import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className={`form-group ${className}`}>
      {label && <label className="label">{label}</label>}
      <input
        className={`input-field ${error ? 'input-error' : ''}`}
        {...props}
      />
      {error && <span className="error-text">{error}</span>}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className = '', ...props }: TextareaProps) {
  return (
    <div className={`form-group ${className}`}>
      {label && <label className="label">{label}</label>}
      <textarea
        className={`input-field ${error ? 'input-error' : ''}`}
        style={{ minHeight: '80px', resize: 'vertical' } as React.CSSProperties}
        {...props}
      />
      {error && <span className="error-text">{error}</span>}
    </div>
  );
}
