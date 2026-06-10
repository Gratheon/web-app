import React from 'react';
import styles from './styles.module.less';

type CardProps = {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
};

export default function Card({ children, style = {}, className }: CardProps) {
  return (
    <div className={className ? `${styles.card} ${className}` : styles.card} style={style}>
      {children}
    </div>
  );
}
