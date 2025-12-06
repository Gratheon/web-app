import { h } from 'preact'
import { useState } from 'preact/hooks'
import T from '@/shared/translate'
import QueenColor from '@/page/hiveEdit/hiveTopInfo/queenColor'
import { getQueenColorFromYear } from '@/page/hiveEdit/hiveTopInfo/queenColor/utils'
import styles from './QueenInfoForm.module.less'

interface QueenInfoFormProps {
	name?: string
	race?: string
	year?: string
	color?: string
	onNameChange?: (name: string) => void
	onRaceChange?: (race: string) => void
	onYearChange?: (year: string) => void
	onColorChange?: (color: string) => void
	editable?: boolean
	showLabels?: boolean
}

export default function QueenInfoForm({
	name,
	race,
	year,
	color,
	onNameChange,
	onRaceChange,
	onYearChange,
	onColorChange,
	editable = true,
	showLabels = true
}: QueenInfoFormProps) {
	return (
		<div className={styles.queenInfoForm}>
			{showLabels && (
				<label>
					<T>Queen Information</T>
				</label>
			)}
			<div className={styles.formGroup}>
				<label htmlFor="queen-name">
					<T>Queen Name</T>
				</label>
				<input
					id="queen-name"
					type="text"
					value={name || ''}
					onChange={(e: any) => onNameChange?.(e.target.value)}
					disabled={!editable}
					placeholder="Enter queen name"
				/>
			</div>

			<div className={styles.formGroup}>
				<label htmlFor="queen-race">
					<T>Race</T>
				</label>
				<input
					id="queen-race"
					type="text"
					value={race || ''}
					onChange={(e: any) => onRaceChange?.(e.target.value)}
					disabled={!editable}
					placeholder="e.g. Carniolan, Italian, etc."
				/>
			</div>

			<div className={styles.formGroup}>
				<label htmlFor="queen-year">
					<T>Year Added</T>
				</label>
				<input
					id="queen-year"
					type="text"
					value={year || ''}
					onChange={(e: any) => {
						onYearChange?.(e.target.value)
						if (onColorChange) {
							onColorChange(null)
						}
					}}
					disabled={!editable}
					placeholder="YYYY"
				/>
				{year && (
					<div className={styles.colorPreview}>
						<QueenColor year={year} color={color} />
					</div>
				)}
			</div>
		</div>
	)
}

