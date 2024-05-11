import React from 'react'
import { useNavigate } from 'react-router-dom'

import styles from './index.less'
import Loader from '../loader'

type ButtonProps = {
	onClick?: any
	onMouseOver?: any
	onMouseOut?: any
	className?: string | string[] // small, green
	color?: string
	size?: string
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
	className = null,
	size = null,
	color = 'black',
	type = 'button',
	onClick = () => {},
	onMouseOver = () => {},
	onMouseOut = () => {},
	children = null,
	href = null
}: ButtonProps) {
	let navigate = useNavigate()

	let classNames = []
	if (typeof color === 'string') {
		classNames.push(styles[color])
	}
	if (typeof size === 'string') {
		classNames.push(styles[size])
	}
	if (typeof className === 'string') {
		classNames.push(className)
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
			onMouseOver={onMouseOver}
			onMouseOut={onMouseOut}
		>
			{loading && <Loader size={0} />}
			{!loading && children}
		</button>
	)
}
