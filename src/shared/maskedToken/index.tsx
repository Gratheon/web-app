import React, { useState } from 'react'

import Button from '@/shared/button'
import T from '@/shared/translate'

import styles from './style.module.less'

type MaskedTokenProps = {
	token: string
	hiddenByDefault?: boolean
	containerClassName?: string
	tokenClassName?: string
	buttonClassName?: string
	buttonSize?: 'small' | string
}

export default function MaskedToken({
	token,
	hiddenByDefault = true,
	containerClassName = '',
	tokenClassName = '',
	buttonClassName = '',
	buttonSize = 'small',
}: MaskedTokenProps) {
	const [isHidden, setIsHidden] = useState(hiddenByDefault)

	const maskedToken = '*'.repeat(token.length)
	const value = isHidden ? maskedToken : token

	return (
		<div className={`${styles.container} ${containerClassName}`.trim()}>
			<div className={`${styles.token} ${tokenClassName}`.trim()}>{value}</div>
			<Button size={buttonSize} className={buttonClassName} onClick={() => setIsHidden(!isHidden)}>
				<T>Toggle</T>
			</Button>
		</div>
	)
}
