import React from 'react'
import { useNavigate } from 'react-router-dom'

import styles from './index.less'
import Loader from '../loader'

type ButtonProps = {
	onClick?: any
	className?: string | string[] // small, green
	style?: any
	title?: string
	loading?: boolean
	type?: 'button' | 'submit' | 'reset' | undefined
	children?: any
	href?: string|null
}

export default function Button({
	style = {},
	title = '',
	loading = false,
	className = 'black',
	type = 'button',
	onClick = () => {},
	children = null,
	href = null
}: ButtonProps) {
	let navigate = useNavigate()

	let classNames = []
	if (typeof className === 'string') {
		classNames = [styles[className]]
	} else {
		// @ts-ignore
		for (const v of className) {
			classNames.push(styles[`${styles[v]}`])
		}
	}

	if(href !== null){
		onClick=()=>{
			navigate(href, { replace: true })
		}
	}

	return (
		<button
			style={style}
			disabled={loading}
			type={type}
			title={title}
			className={classNames.join(' ')}
			onClick={onClick}
		>
			{loading && <Loader size={0} />}
			{!loading && children}
		</button>
	)
}
