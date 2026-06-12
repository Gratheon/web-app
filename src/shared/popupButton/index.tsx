import React, { useState, useRef, useEffect } from 'react'
import style from './index.module.less'
import Button from '@/shared/button'
import Dots3Icon from '@/icons/dots3'

const useOutsideClickHandler = (ref: any, callback: any, enabled: boolean) => {
	useEffect(() => {
		if (!enabled) return

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
	}, [callback, enabled, ref])
}

type PopupButtonGroupProps = {
	children: any
	style?: any
	className?: string
}

export function PopupButtonGroup({
	children,
	style: inlineStyle = {},
	className = '',
}: PopupButtonGroupProps) {
	const classNames = ['popupButtonGroup', style.popupButtonGroup]
	if (className) {
		classNames.push(className)
	}

	return (
		<div className={classNames.join(' ')} style={inlineStyle}>
			{children}
		</div>
	)
}

type PopupButtonProps = {
	children: any
	className?: string
	align?: string
	title?: string
}
export function PopupButton({
	children,
	className = '',
	align = 'left',
	title = 'More actions',
}: PopupButtonProps) {
	const [extraButtonsVisible, setExtraButtonsVisible] = useState(false)
	const modalRef = useRef(null)
	const triggerClassNames = [
		className,
		'popupTrigger',
		style.popupTriggerButton,
	]
		.filter(Boolean)
		.join(' ')
	const popupClassNames = [
		style.popup,
		align === 'right' ? style.alignRight : style.alignLeft,
	].join(' ')

	useOutsideClickHandler(
		modalRef,
		() => setExtraButtonsVisible(false),
		extraButtonsVisible
	)

	useEffect(() => {
		if (!extraButtonsVisible || typeof window === 'undefined') return

		const handleKeyDown = (evt: KeyboardEvent) => {
			if (evt.key !== 'Escape') return
			setExtraButtonsVisible(false)
		}

		document.addEventListener('keydown', handleKeyDown)
		return () => {
			document.removeEventListener('keydown', handleKeyDown)
		}
	}, [extraButtonsVisible])

	return (
		<div ref={modalRef} className={style.popupButtonRoot}>
			<Button
				className={triggerClassNames}
				title={title}
				aria-label={title}
				aria-haspopup="menu"
				aria-expanded={extraButtonsVisible}
				onClick={(e: any) => {
					setExtraButtonsVisible(!extraButtonsVisible)
					e.preventDefault()
				}}
			>
				<Dots3Icon />

			</Button>
			{extraButtonsVisible && (
				<div
					className={popupClassNames}
					role="menu"
				>
					{children}
				</div>
			)}
		</div>
	)
}
