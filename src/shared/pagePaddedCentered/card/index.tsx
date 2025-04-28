import React from 'react';
import styles from './styles.module.less';


export default function Card({ children }) {
  return (
    <div className={styles.card}>
      {children}
    </div>
  );
}
