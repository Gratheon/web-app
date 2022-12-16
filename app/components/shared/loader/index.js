import React from 'react'
import { Component } from 'preact/dist/preact'
import styles from './styles.less'

class Loading extends Component {
	render() {
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
}

export default Loading
