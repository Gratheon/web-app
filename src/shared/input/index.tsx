import { h, JSX } from 'preact';
import styles from './styles.module.less';

interface InputProps extends JSX.HTMLAttributes<HTMLInputElement> {
  label?: JSX.Element | string;
  type?: string;
  value?: string | number;
  onChange?: (event: JSX.TargetedEvent<HTMLInputElement, Event>) => void;
}

export default function Input({ label, ...rest }: InputProps) {
  return (
    <div className={styles.inputGroup}>
      {label && <label className={styles.label}>{label}</label>}
      <input className={styles.input} {...rest} />
    </div>
  );
}
