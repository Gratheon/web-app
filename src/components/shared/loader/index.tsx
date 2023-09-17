import React from 'react'
import styles from './styles.less'

export default function Loading({ small = false }) {
	if(small){
		return (
			<div className={`${styles.loader} ${styles.loaderSmall}`}>
			<div className={styles.sun}>🌻</div>
			<div className={styles.bees}>
				<div className={`${styles.b3} ${styles.bee}`}></div>
			</div>
		</div>
		)
	}

	return (
		<div className={styles.loader}>
			<div className={styles.sun}>🌻</div>
			<div className={styles.bees}>
				<div className={styles.b1}></div>
				<div className={styles.b2}></div>
				<div className={styles.b3}></div>
				<div className={styles.b4}></div>
				<div className={styles.b5}></div>
				<div className={styles.b6}></div>
			</div>
		</div>
	)
}
