import React from 'react'
import { Component } from 'preact'
import styles from './styles.less'

export default class VisualForm extends Component {
	render({ children, onSubmit, style = '' }) {
		return (
			<form
				method="POST"
				style={style}
				className={styles.form}
				onSubmit={onSubmit}
			>
				{children}
			</form>
		)
	}
}
