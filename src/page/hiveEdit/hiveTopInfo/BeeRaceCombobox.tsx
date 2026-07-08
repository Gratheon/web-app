import { h } from 'preact'
import { useMemo, useState } from 'preact/hooks'
import styles from './BeeRaceCombobox.module.less'

export const popularBeeRaces = [
	'Italian',
	'Carniolan',
	'Buckfast',
	'Caucasian',
	'Russian',
	'Carnica',
	'Ligustica',
	'VSH',
	'Cordovan',
	'Black bee',
	'European dark bee',
	'Krainka',
	'Anatolian',
	'Balkan',
	'Local hybrid',
]

interface BeeRaceComboboxProps {
	value: string
	onChange: (value: string) => void
	placeholder?: string
	className?: string
	inputClassName?: string
	onKeyDown?: (e: h.JSX.TargetedKeyboardEvent<HTMLInputElement>) => void
}

export default function BeeRaceCombobox({
	value,
	onChange,
	placeholder = 'Race',
	className,
	inputClassName,
	onKeyDown,
}: BeeRaceComboboxProps) {
	const [isOpen, setIsOpen] = useState(false)
	const normalizedValue = value.trim().toLowerCase()
	const filteredRaces = useMemo(() => {
		if (!normalizedValue) {
			return popularBeeRaces
		}

		return popularBeeRaces.filter((race) =>
			race.toLowerCase().includes(normalizedValue)
		)
	}, [normalizedValue])

	return (
		<div
			className={`${styles.combobox} ${className || ''}`}
			onBlur={(e: any) => {
				if (!e.currentTarget.contains(e.relatedTarget)) {
					setIsOpen(false)
				}
			}}
		>
			<input
				role="combobox"
				aria-autocomplete="list"
				aria-expanded={isOpen}
				aria-controls="bee-race-combobox-options"
				type="text"
				className={`${styles.input} ${inputClassName || ''}`}
				value={value}
				onFocus={() => setIsOpen(true)}
				onChange={(e: h.JSX.TargetedEvent<HTMLInputElement, Event>) => {
					onChange((e.target as HTMLInputElement).value)
					setIsOpen(true)
				}}
				onKeyDown={(e) => {
					if (e.key === 'ArrowDown') {
						e.preventDefault()
						setIsOpen(true)
					}
					if (e.key === 'Escape' && isOpen) {
						e.preventDefault()
						setIsOpen(false)
						return
					}
					onKeyDown?.(e)
				}}
				placeholder={placeholder}
			/>
			<button
				type="button"
				className={styles.toggleButton}
				aria-label="Show bee races"
				onMouseDown={(e) => e.preventDefault()}
				onClick={() => setIsOpen((open) => !open)}
			>
				<svg
					className={styles.chevronIcon}
					viewBox="0 0 12 8"
					aria-hidden="true"
				>
					<path
						d="M1 1.5L6 6.5L11 1.5"
						fill="none"
						stroke="currentColor"
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="1.75"
					/>
				</svg>
			</button>
			{isOpen && (
				<div
					id="bee-race-combobox-options"
					role="listbox"
					className={styles.options}
				>
					{filteredRaces.length > 0 ? (
						filteredRaces.map((race) => (
							<button
								type="button"
								key={race}
								role="option"
								aria-selected={race === value}
								className={styles.option}
								onMouseDown={(e) => e.preventDefault()}
								onClick={() => {
									onChange(race)
									setIsOpen(false)
								}}
							>
								{race}
							</button>
						))
					) : (
						<div className={styles.emptyOption}>Type a custom race</div>
					)}
				</div>
			)}
		</div>
	)
}
