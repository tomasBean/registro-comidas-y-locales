import type { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  block?: boolean;
}

export function buttonClassName(variant: ButtonProps['variant'] = 'secondary', block = false): string {
  return [styles.button, styles[variant], block ? styles.block : ''].filter(Boolean).join(' ');
}

export function Button({ variant = 'secondary', block = false, type = 'button', className, ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={[buttonClassName(variant, block), className].filter(Boolean).join(' ')}
      {...rest}
    />
  );
}
