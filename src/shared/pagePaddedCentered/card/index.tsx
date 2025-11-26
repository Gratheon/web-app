import React from 'react';
import styles from './styles.module.less';


export default function Card({ children, style = {} }) {
  return (
    <div className={styles.card} style={style}>
      {children}
    </div>
  );
}
