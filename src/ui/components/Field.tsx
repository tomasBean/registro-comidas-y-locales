import { useId } from 'react';
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import styles from './Field.module.css';

interface FieldShellProps {
  label: string;
  hint?: string;
  error?: string;
  children: (ids: { id: string; describedBy?: string }) => ReactNode;
}

function FieldShell({ label, hint, error, children }: FieldShellProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const message = error ?? hint;
  return (
    <div className={[styles.field, error ? styles.invalid : ''].join(' ')}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      {children({ id, describedBy: message ? messageId : undefined })}
      {message ? (
        <p id={messageId} className={styles.message}>
          {message}
        </p>
      ) : null}
    </div>
  );
}

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  hint?: string;
  error?: string;
}

export function TextField({ label, hint, error, ...rest }: TextFieldProps) {
  return (
    <FieldShell label={label} hint={hint} error={error}>
      {({ id, describedBy }) => (
        <input id={id} className={styles.input} aria-describedby={describedBy} aria-invalid={error ? true : undefined} {...rest} />
      )}
    </FieldShell>
  );
}

interface TextAreaFieldProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label: string;
  hint?: string;
  error?: string;
}

export function TextAreaField({ label, hint, error, rows = 2, ...rest }: TextAreaFieldProps) {
  return (
    <FieldShell label={label} hint={hint} error={error}>
      {({ id, describedBy }) => (
        <textarea id={id} rows={rows} className={styles.input} aria-describedby={describedBy} aria-invalid={error ? true : undefined} {...rest} />
      )}
    </FieldShell>
  );
}
