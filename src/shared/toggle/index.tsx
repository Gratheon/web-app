import styles from './index.module.less'

type ToggleProps = {
	checked: boolean
	onChange: (checked: boolean) => void
	disabled?: boolean
	className?: string
	title?: string
	'aria-label'?: string
	offIcon?: any
	onIcon?: any
}

export default function Toggle({
	checked,
	onChange,
	disabled = false,
	className = '',
	title = '',
	offIcon = null,
	onIcon = null,
	...rest
}: ToggleProps) {
	const classNames = [styles.toggle, checked ? styles.checked : '', className]
		.filter(Boolean)
		.join(' ')

	return (
		<button
			{...rest}
			type="button"
			role="switch"
			aria-checked={checked}
			title={title}
			disabled={disabled}
			className={classNames}
			onClick={() => {
				if (disabled) {
					return
				}

				onChange(!checked)
			}}
		>
			<span className={styles.track} aria-hidden="true">
				{offIcon && <span className={styles.offIcon}>{offIcon}</span>}
				<span className={styles.thumb} />
				{onIcon && <span className={styles.onIcon}>{onIcon}</span>}
			</span>
		</button>
	)
}
