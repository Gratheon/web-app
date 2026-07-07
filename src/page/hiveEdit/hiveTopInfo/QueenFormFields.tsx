import { h } from 'preact'

import T from '@/shared/translate'
import Button from '@/shared/button'
import QueenColor from '@/page/hiveEdit/hiveTopInfo/queenColor'
import QueenColorPicker from '@/shared/queenColorPicker'
import RefreshIcon from '@/icons/RefreshIcon'
import BeeRaceCombobox from './BeeRaceCombobox'
import styles from './AddQueenModal.module.less'
import inputStyles from '@/shared/input/styles.module.less'

export type QueenFormMode = 'create' | 'warehouse'

export type WarehouseQueen = {
	id: string
	name?: string | null
	race?: string | null
	added?: string | null
	color?: string | null
}

type QueenFormFieldsProps = {
	mode: QueenFormMode
	allowModeSwitch?: boolean
	warehouseQueens: WarehouseQueen[]
	warehouseLoading?: boolean
	selectedWarehouseQueenId: string
	name: string
	race: string
	year: string
	customColor: string | null
	randomNameLoading?: boolean
	autoFocusName?: boolean
	onModeChange: (mode: QueenFormMode) => void
	onSelectedWarehouseQueenIdChange: (familyId: string) => void
	onNameChange: (name: string) => void
	onRaceChange: (race: string) => void
	onYearChange: (year: string) => void
	onCustomColorChange: (color: string | null) => void
	onRefreshName?: () => void
}

export default function QueenFormFields({
	mode,
	allowModeSwitch = true,
	warehouseQueens,
	warehouseLoading = false,
	selectedWarehouseQueenId,
	name,
	race,
	year,
	customColor,
	randomNameLoading = false,
	autoFocusName = false,
	onModeChange,
	onSelectedWarehouseQueenIdChange,
	onNameChange,
	onRaceChange,
	onYearChange,
	onCustomColorChange,
	onRefreshName,
}: QueenFormFieldsProps) {
	const hasWarehouseQueens = warehouseQueens.length > 0
	const selectedWarehouseQueen = warehouseQueens.find(
		(queen) => queen.id === selectedWarehouseQueenId
	)
	const currentYear = new Date().getFullYear().toString()

	return (
		<>
			{allowModeSwitch && hasWarehouseQueens && (
				<div className={styles.modeSwitch}>
					<Button
						type="button"
						onClick={() => onModeChange('create')}
						className={`${styles.modeButton} ${
							mode === 'create' ? styles.activeMode : ''
						}`}
					>
						<T>Create New Queen</T>
					</Button>
					<Button
						type="button"
						onClick={() => onModeChange('warehouse')}
						className={`${styles.modeButton} ${
							mode === 'warehouse' ? styles.activeMode : ''
						}`}
					>
						<T>Add From Warehouse</T>
					</Button>
				</div>
			)}

			{mode === 'warehouse' ? (
				<div className={styles.warehouseSelectWrap}>
					<label className={inputStyles.label}>
						<T>Select Queen</T>
					</label>
					<select
						className={inputStyles.input}
						value={selectedWarehouseQueenId}
						onChange={(e: h.JSX.TargetedEvent<HTMLSelectElement, Event>) =>
							onSelectedWarehouseQueenIdChange((e.target as HTMLSelectElement).value)
						}
						disabled={warehouseLoading}
					>
						{warehouseQueens.map((queen) => (
							<option key={queen.id} value={queen.id}>
								{queen.name || `#${queen.id}`} {queen.added ? `(${queen.added})` : ''}
							</option>
						))}
					</select>

					{selectedWarehouseQueen && (
						<div className={styles.warehousePreview}>
							<QueenColor
								year={selectedWarehouseQueen.added || currentYear}
								color={selectedWarehouseQueen.color || null}
							/>
							<div>
								<div>{selectedWarehouseQueen.name || <T>Unnamed Queen</T>}</div>
								<div className={styles.previewMeta}>
									{selectedWarehouseQueen.added || '-'}
								</div>
								<div className={styles.previewMeta}>
									{selectedWarehouseQueen.race || <T>Race unknown</T>}
								</div>
							</div>
						</div>
					)}
				</div>
			) : (
				<>
					<div className={styles.nameInputWrapper}>
						<div style={{ flex: 1 }}>
							<label className={inputStyles.label}>
								<T>Queen Name</T>
							</label>
							<input
								className={inputStyles.input}
								type="text"
								value={name}
								onChange={(e: h.JSX.TargetedEvent<HTMLInputElement, Event>) =>
									onNameChange((e.target as HTMLInputElement).value)
								}
								autoFocus={autoFocusName}
								placeholder="Enter queen name"
							/>
						</div>
						<Button
							type="button"
							onClick={onRefreshName}
							disabled={!onRefreshName || randomNameLoading}
							style={{
								marginTop: '24px',
								height: '40px',
								minWidth: '40px',
								padding: '0 12px',
							}}
							title="Get new name suggestion"
						>
							<RefreshIcon />
						</Button>
					</div>
					<label className={inputStyles.label}>
						<T>Race</T>
					</label>
					<BeeRaceCombobox
						className={styles.raceCombobox}
						inputClassName={inputStyles.input}
						value={race}
						onChange={onRaceChange}
						placeholder="e.g. Carniolan, Italian, etc."
					/>

					<div className={styles.yearInputWrapper}>
						<div>
							<label className={inputStyles.label}>
								<T>Year</T>
							</label>
							<input
								className={inputStyles.input}
								type="text"
								value={year}
								maxLength={4}
								onChange={(e: h.JSX.TargetedEvent<HTMLInputElement, Event>) => {
									onYearChange((e.target as HTMLInputElement).value)
									onCustomColorChange(null)
								}}
							/>
						</div>
						<div className={styles.colorPickerWrapper}>
							<QueenColorPicker
								year={year}
								color={customColor}
								onColorChange={(value: string) => onCustomColorChange(value)}
							/>
						</div>
					</div>
				</>
			)}
		</>
	)
}
