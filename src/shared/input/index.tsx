import { h } from 'preact';
import { JSX } from 'preact';
import styles from './styles.module.less';

interface InputProps extends Omit<JSX.HTMLAttributes<HTMLInputElement>, 'label'> {
  label?: JSX.Element | string;
  type?: string;
}

export default function Input({ label, ...rest }: InputProps) {
  return (
    <div className={styles.inputGroup}>
      {label && <label className={styles.label}>{label}</label>}
      <input className={styles.input} {...rest} />
    </div>
  );
}
