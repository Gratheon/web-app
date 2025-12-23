import React from 'react'
import { useNavigate } from 'react-router-dom'

import styles from './index.module.less'
import Loader from '../loader'

type ButtonProps = {
	onClick?: any
	onMouseOver?: any
	onMouseOut?: any
	className?: string | string[] // small, green
	color?: string
	size?: 'small' | string
	style?: any
	title?: string
	iconOnly?: boolean
	loading?: boolean
	disabled?: boolean
	type?: 'button' | 'submit' | 'reset' | undefined
	children?: any
	href?: string | null
}

export default function Button({
	style = {},
	title = '',
	loading = false,
	iconOnly = false,
	className = null,
	size = null,
	color = 'black',
	type = 'button',
	disabled = false,
	onClick = () => { },
	onMouseOver = () => { },
	onMouseOut = () => { },
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
	
	if (iconOnly) {
		classNames.push(styles.iconOnly)
	}

	const handleClick = (e: any) => {
		if (e.ctrlKey || e.metaKey) return;

		if (href !== null) {
			if (href.startsWith('http')) {
				window.location.href = href
			} else {
				navigate(href, { replace: true })
			}
		} else {
			onClick(e);
		}
	};

	const handleKeyDown = (e: any) => {
		if (e.ctrlKey || e.metaKey) {
			e.preventDefault();
			e.stopPropagation();
			return false;
		}
	};

	return (
		<button
			style={style}
			disabled={disabled || loading}
			type={type}
			title={title}
			className={classNames.join(' ')}
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			onMouseOver={onMouseOver}
			onMouseOut={onMouseOut}
		>
			{loading && <Loader size={0} />}
			{!loading && children}
		</button>
	)
}
