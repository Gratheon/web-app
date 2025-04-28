import React from 'react';
import styles from './styles.module.less';

interface PagePaddedCenteredProps {
  children: React.ReactNode;
  className?: string;
}

export default function PagePaddedCentered({ children, className }: PagePaddedCenteredProps) {
  return (
    <div className={className ? `${styles.pagePaddedCentered} ${className}` : styles.pagePaddedCentered}>
      {children}
    </div>
  );
}
