import Button from '@/shared/button'
import T from '@/shared/translate'
import { detectionLabel, formatQueenOption } from './queenDetector.capture'
import type {
	AssignMode,
	BestCapture,
	QueenOption,
} from './queenDetector.types'
import styles from './queenDetector.module.less'

type BestCaptureBoxStyle = {
	left: string
	top: string
	width: string
	height: string
}

type QueenDetectorAssignmentPanelProps = {
	bestCapture: BestCapture
	bestCaptureBoxStyle?: BestCaptureBoxStyle
	hasHiveContext: boolean
	assignmentMode: AssignMode
	setAssignmentMode: (mode: AssignMode) => void
	queenOptions: QueenOption[]
	selectedQueenId: string
	setSelectedQueenId: (id: string) => void
	selectedQueen?: QueenOption
	newQueenName: string
	setNewQueenName: (name: string) => void
	newQueenYear: string
	setNewQueenYear: (year: string) => void
	newQueenRace: string
	setNewQueenRace: (race: string) => void
	isSavingCapture: boolean
	savedFamilyId: string | null
	savedPreviewUrl: string | null
	clearSaveResult: () => void
	onSaveBestCapture: (event: any) => void
}

export default function QueenDetectorAssignmentPanel({
	bestCapture,
	bestCaptureBoxStyle,
	hasHiveContext,
	assignmentMode,
	setAssignmentMode,
	queenOptions,
	selectedQueenId,
	setSelectedQueenId,
	selectedQueen,
	newQueenName,
	setNewQueenName,
	newQueenYear,
	setNewQueenYear,
	newQueenRace,
	setNewQueenRace,
	isSavingCapture,
	savedFamilyId,
	savedPreviewUrl,
	clearSaveResult,
	onSaveBestCapture,
}: QueenDetectorAssignmentPanelProps) {
	return (
		<section className={styles.bestCapturePanel}>
			<div className={styles.bestCaptureHeader}>
				<div>
					<h3>
						<T>Best confidence capture</T>
					</h3>
					<p>
						<T>
							This frame stayed only in your browser until you assign it to a
							queen.
						</T>
					</p>
				</div>
				<span className={styles.captureBadge}>
					{Math.round(bestCapture.confidence * 100)}%
				</span>
			</div>

			<div className={styles.bestCaptureContent}>
				<div className={styles.bestCaptureFrame}>
					<img
						className={styles.bestCaptureImage}
						src={bestCapture.imageUrl}
						alt="Best confidence queen capture"
						draggable={false}
					/>
					{bestCaptureBoxStyle && (
						<div className={styles.bestCaptureBox} style={bestCaptureBoxStyle}>
							<span>{detectionLabel(bestCapture.detection)}</span>
						</div>
					)}
				</div>

				<form className={styles.assignmentPanel} onSubmit={onSaveBestCapture}>
					<h3>
						<T>Assign this capture</T>
					</h3>
					<p className={styles.assignmentHint}>
						{hasHiveContext ? (
							<T>
								Save a cropped queen image for a new or existing queen in this
								hive.
							</T>
						) : (
							<T>
								Save a cropped queen image for a new or existing warehouse
								queen.
							</T>
						)}
					</p>

					<div className={styles.modeSwitch}>
						<Button
							type="button"
							className={`${styles.modeButton} ${
								assignmentMode === 'existing' ? styles.activeMode : ''
							}`}
							disabled={!queenOptions.length}
							onClick={() => {
								clearSaveResult()
								setAssignmentMode('existing')
							}}
						>
							<T>Existing queen</T>
						</Button>
						<Button
							type="button"
							className={`${styles.modeButton} ${
								assignmentMode === 'new' ? styles.activeMode : ''
							}`}
							onClick={() => {
								clearSaveResult()
								setAssignmentMode('new')
							}}
						>
							<T>New queen</T>
						</Button>
					</div>

					{assignmentMode === 'existing' ? (
						<div className={styles.formField}>
							<label>
								<T>Select Queen</T>
							</label>
							<select
								className={styles.assignmentInput}
								value={selectedQueenId}
								onChange={(event: any) => {
									clearSaveResult()
									setSelectedQueenId(event.target.value)
								}}
							>
								{queenOptions.map((option) => (
									<option
										key={`${option.source}-${option.id}`}
										value={option.id}
									>
										{formatQueenOption(option)}
									</option>
								))}
							</select>
							{selectedQueen && (
								<p className={styles.captureMeta}>
									<T>Selected</T>:{' '}
									{selectedQueen.name || `#${selectedQueen.id}`}
								</p>
							)}
						</div>
					) : (
						<div className={styles.formGrid}>
							<div className={styles.formField}>
								<label>
									<T>Queen Name</T>
								</label>
								<input
									className={styles.assignmentInput}
									value={newQueenName}
									onChange={(event: any) => {
										clearSaveResult()
										setNewQueenName(event.target.value)
									}}
									placeholder="Queen name"
								/>
							</div>
							<div className={styles.formField}>
								<label>
									<T>Year</T>
								</label>
								<input
									className={styles.assignmentInput}
									value={newQueenYear}
									maxLength={4}
									onChange={(event: any) => {
										clearSaveResult()
										setNewQueenYear(event.target.value)
									}}
									placeholder="YYYY"
								/>
							</div>
							<div className={styles.formField}>
								<label>
									<T>Race</T>
								</label>
								<input
									className={styles.assignmentInput}
									value={newQueenRace}
									onChange={(event: any) => {
										clearSaveResult()
										setNewQueenRace(event.target.value)
									}}
									placeholder="e.g. Carniolan"
								/>
							</div>
						</div>
					)}

					<div className={styles.assignmentControls}>
						<Button type="submit" color="green" loading={isSavingCapture}>
							<T>Save queen capture</T>
						</Button>
					</div>

					{savedFamilyId && savedPreviewUrl && (
						<div className={styles.saveResult}>
							<T>Saved cropped queen preview for queen</T> #{savedFamilyId}.
						</div>
					)}
				</form>
			</div>
		</section>
	)
}
