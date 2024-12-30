import React, { useState, useRef, useEffect } from 'react'
import style from './index.module.less'
import Button from '../button'
import Dots3Icon from '../../icons/dots3.tsx'

const useOutsideClickHandler = (ref: any, callback: any) => {
	useEffect(() => {
		const handleClickOutside = (evt: any) => {
			if (ref.current && !ref.current.contains(evt.target)) {
				callback() //Do what you want to handle in the callback
			}
		}
		if (typeof window === 'undefined') {
			return () => { }
		}
		document.addEventListener('mousedown', handleClickOutside)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	})
}

type PopupButtonGroupProps = {
	children: any
	style?: any
	className?: string
}

export function PopupButtonGroup({
	children,
	style: inlineStyle = {},
	className = 'black',
}: PopupButtonGroupProps) {
	return (
		<div className={`popupButtonGroup`} style={inlineStyle}>
			{children}
		</div>
	)
}

type PopupButtonProps = {
	children: any
	className?: string
	align?: string
}
export function PopupButton({ children, className = '', align = 'left' }: PopupButtonProps) {
	const [extraButtonsVisible, setExtraButtonsVisible] = useState(false)
	const modalRef = useRef(null)

	let popupStyle = '';
	if (align === 'right') {
		popupStyle = 'left: auto;right: 8px;'
	}

	useOutsideClickHandler(modalRef, () => setExtraButtonsVisible(false))

	return (
		<div ref={modalRef} style={{ width: 35 }}>
			<Button
				className={`${className} popupTrigger`}
				onClick={(e: any) => {
					setExtraButtonsVisible(!extraButtonsVisible)
					e.preventDefault()
				}}
			>
				<Dots3Icon />

			</Button>
			{extraButtonsVisible && <div
				style={popupStyle}
				className={style.popup}>{children}</div>}
		</div>
	)
}
