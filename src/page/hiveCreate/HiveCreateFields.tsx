import T from '@/shared/translate'

import { BOX_SYSTEM_COLORS } from './constants'
import styles from './styles.module.less'

type HiveCreateFieldsProps = {
	hiveType: string
	handleHiveTypeChange: (event: any) => void
	hiveNumber?: number
	setHiveNumber: (value: number | undefined) => void
	boxCount: number
	frameCount: number
	updateHiveDimensions: (newBoxCount: number, newFrameCount: number) => void
	setFrameCount: (value: number) => void
	boxSystems: any[]
	selectedBoxSystem: any
	boxSystemId?: string
	setBoxSystemId: (value: string) => void
	isBoxSystemOpen: boolean
	setIsBoxSystemOpen: (value: boolean | ((open: boolean) => boolean)) => void
	boxSystemPickerRef: any
}

export default function HiveCreateFields({
	hiveType,
	handleHiveTypeChange,
	hiveNumber,
	setHiveNumber,
	boxCount,
	frameCount,
	updateHiveDimensions,
	setFrameCount,
	boxSystems,
	selectedBoxSystem,
	boxSystemId,
	setBoxSystemId,
	isBoxSystemOpen,
	setIsBoxSystemOpen,
	boxSystemPickerRef,
}: HiveCreateFieldsProps) {
	return (
		<>
			<div className={styles.formField}>
				<label className={styles.formLabel}>
					<T>Hive Type</T>
				</label>
				<div className={styles.radioGroup}>
					<label className={styles.radioLabel}>
						<input
							type="radio"
							value="vertical"
							checked={hiveType === 'vertical'}
							onChange={handleHiveTypeChange}
						/>
						<T>Vertical</T>
					</label>
					<label className={styles.radioLabel}>
						<input
							type="radio"
							value="horizontal"
							checked={hiveType === 'horizontal'}
							onChange={handleHiveTypeChange}
						/>
						<T>Horizontal</T>
					</label>
					<label className={styles.radioLabel}>
						<input
							type="radio"
							value="nucleus"
							checked={hiveType === 'nucleus'}
							onChange={handleHiveTypeChange}
						/>
						<T>Nucleus (Nuc)</T>
					</label>
				</div>
			</div>

			<div className={styles.formField}>
				<label htmlFor="hiveNumber" className={styles.formLabel}>
					<T>Hive Number</T>
				</label>
				<input
					className={styles.smallInput}
					type="number"
					id="hiveNumber"
					name="hiveNumber"
					value={hiveNumber || ''}
					onInput={(e: any) => {
						const val = e.target.value
						setHiveNumber(val ? parseInt(val, 10) : undefined)
					}}
					min="1"
					step="1"
				/>
			</div>

			<div className={styles.formField}>
				<label htmlFor="boxCount" className={styles.formLabel}>
					<T>Section count</T>
				</label>
				<input
					className={styles.smallInput}
					type="number"
					id="boxCount"
					name="boxCount"
					value={boxCount}
					onInput={(e: any) => {
						if (hiveType === 'nucleus') return
						const newBoxCount = parseInt(e.target.value, 10)
						if (newBoxCount < 1 || newBoxCount > 6) return
						updateHiveDimensions(newBoxCount, frameCount)
					}}
					min="1"
					max="6"
					step="1"
					disabled={hiveType === 'nucleus'}
				/>
			</div>

			<div className={styles.formField}>
				<label htmlFor="frameCount" className={styles.formLabel}>
					<T>Frame count</T>
				</label>
				<input
					className={styles.smallInput}
					type="number"
					id="frameCount"
					name="frameCount"
					value={frameCount}
					onInput={(e: any) => {
						if (hiveType === 'nucleus') return
						setFrameCount(parseInt(e.target.value, 10))
					}}
					min="0"
					max="25"
					step="1"
					disabled={hiveType === 'nucleus'}
				/>
			</div>

			{hiveType !== 'horizontal' ? (
				<div className={styles.formField}>
					<label className={styles.formLabel}>
						<T>Box System</T>
					</label>
					<div className={styles.boxSystemPicker} ref={boxSystemPickerRef}>
						<div
							className={`${styles.boxSystemSelectTrigger} ${
								!boxSystems.length ? styles.boxSystemSelectTriggerDisabled : ''
							}`}
							aria-haspopup="listbox"
							aria-expanded={isBoxSystemOpen}
							aria-disabled={!boxSystems.length}
							role="button"
							tabIndex={0}
							onClick={() => {
								if (!boxSystems.length) return
								setIsBoxSystemOpen((open) => !open)
							}}
							onKeyDown={(event) => {
								if (!boxSystems.length) return
								if (event.key === 'Enter' || event.key === ' ') {
									event.preventDefault()
									setIsBoxSystemOpen((open) => !open)
								}
								if (event.key === 'Escape') setIsBoxSystemOpen(false)
							}}
						>
							{selectedBoxSystem ? (
								<span className={styles.boxSystemTriggerValue}>
									<span
										className={styles.boxSystemOptionDot}
										style={{
											backgroundColor:
												BOX_SYSTEM_COLORS[
													boxSystems.findIndex(
														(s: any) => s.id === selectedBoxSystem.id
													) % BOX_SYSTEM_COLORS.length
												].accent,
										}}
									></span>
									<span>
										{selectedBoxSystem.name}
										{selectedBoxSystem.isDefault ? ' (Default)' : ''}
									</span>
								</span>
							) : (
								<span>
									<T>No hive systems</T>
								</span>
							)}
							<span className={styles.boxSystemChevron}>▾</span>
						</div>
						{isBoxSystemOpen && boxSystems.length ? (
							<div className={styles.boxSystemDropdown} role="listbox">
								{boxSystems.map((system: any, index: number) => {
									const isActive = system.id === boxSystemId
									return (
										<div
											key={system.id}
											role="option"
											aria-selected={isActive}
											tabIndex={0}
											className={`${styles.boxSystemOption} ${
												isActive ? styles.boxSystemOptionActive : ''
											}`}
											onClick={() => {
												setBoxSystemId(system.id)
												setIsBoxSystemOpen(false)
											}}
											onKeyDown={(event) => {
												if (event.key === 'Enter' || event.key === ' ') {
													event.preventDefault()
													setBoxSystemId(system.id)
													setIsBoxSystemOpen(false)
												}
												if (event.key === 'Escape') setIsBoxSystemOpen(false)
											}}
										>
											<span
												className={styles.boxSystemOptionDot}
												style={{
													backgroundColor:
														BOX_SYSTEM_COLORS[index % BOX_SYSTEM_COLORS.length]
															.accent,
												}}
											></span>
											<span>
												{system.name}
												{system.isDefault ? ' (Default)' : ''}
											</span>
										</div>
									)
								})}
							</div>
						) : null}
					</div>
				</div>
			) : null}
		</>
	)
}
