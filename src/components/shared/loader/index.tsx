import React from 'react'
import styles from './styles.less'

export default function Loading({ size = 2 }) {
	if (size == 0) {
		return (<svg version="1.1" width={14} height={14} xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 100 100" enable-background="new 0 0 0 0">
			<path
				style="stroke: white; stroke-linecap: round; stroke-width: 5px;"
				d="M73,50c0-12.7-10.3-23-23-23S27,37.3,27,50 M30.9,50c0-10.5,8.5-19.1,19.1-19.1S69.1,39.5,69.1,50">
				<animateTransform
					attributeName="transform"
					attributeType="XML"
					type="rotate"
					dur="1s"
					from="0 50 50"
					to="360 50 50"
					repeatCount="indefinite" />
			</path>
		</svg>)
	}

	if (size == 1) {
		return (
			<div className={`${styles.loader} ${styles.loaderSmall}`}>
				<div className={styles.bees}>
					<div className={`${styles.b3} ${styles.bee}`}></div>
				</div>
				<div className={styles.sun}>🌻</div>
			</div>
		)
	}

	return (
		<div className={styles.loader}>
			<div className={styles.sun}>🌻</div>
			<div className={styles.bees}>
				<div className={styles.b1}></div>
				<div className={styles.b2}></div>
				{/* <div className={styles.b3}></div>
				<div className={styles.b4}></div>
				<div className={styles.b5}></div>
				<div className={styles.b6}></div> */}
			</div>
		</div>
	)
}
