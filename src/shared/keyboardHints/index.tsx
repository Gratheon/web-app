import { useEffect, useState } from 'react'
import styles from './index.module.less'

const SHORTCUT_HINTS_EVENT = 'gratheon-shortcut-hints'
const SHORTCUT_HINTS_STORAGE_KEY = 'gratheon-shortcut-hints-visible'

type KeyboardHintsProps = {
	keys: string
	className?: string
	absolute?: boolean
}

function getInitialVisibility() {
	if (typeof window === 'undefined') return false
	return localStorage.getItem(SHORTCUT_HINTS_STORAGE_KEY) === '1'
}

export default function KeyboardHints({
	keys,
	className = '',
	absolute = true,
}: KeyboardHintsProps) {
	const [visible, setVisible] = useState(getInitialVisibility)

	useEffect(() => {
		const onVisibilityEvent = (event: Event) => {
			const customEvent = event as CustomEvent<{ visible?: boolean }>
			if (typeof customEvent.detail?.visible !== 'boolean') return
			setVisible(customEvent.detail.visible)
		}

		window.addEventListener(SHORTCUT_HINTS_EVENT, onVisibilityEvent as EventListener)
		return () => {
			window.removeEventListener(SHORTCUT_HINTS_EVENT, onVisibilityEvent as EventListener)
		}
	}, [])

	if (!visible) return null

	const classNames = [styles.keyboardHint]
	if (absolute) classNames.push(styles.absolute)
	if (className) classNames.push(className)

	return <span className={classNames.join(' ')}>{keys}</span>
}
