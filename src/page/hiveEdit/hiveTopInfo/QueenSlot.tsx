import { h } from 'preact'
import { useState } from 'preact/hooks'
import T from '@/shared/translate'
import Button from '@/shared/button'
import QueenIcon from '@/icons/queenIcon'
import TrashIcon from '@/icons/trashIcon'
import PlusIcon from '@/icons/plusIcon'
import QueenColor from '@/page/hiveEdit/hiveTopInfo/queenColor'
import { Family } from '@/models/family'
import styles from './QueenSlot.module.less'

interface QueenSlotProps {
	families: Family[]
	editable: boolean
	onAddQueen: () => void
	onRemoveQueen: (familyId: number) => void
	onUpdateQueen?: (familyId: number, race: string, year: string) => void
	onDragStart?: (familyId: number) => void
	onDragEnd?: () => void
	showAddButton?: boolean
}

export default function QueenSlot({
	families,
	editable,
	onAddQueen,
	onRemoveQueen,
	onUpdateQueen,
	onDragStart,
	onDragEnd,
	showAddButton = false
}: QueenSlotProps) {
	const [draggingId, setDraggingId] = useState<number | null>(null)
	const [editingId, setEditingId] = useState<number | null>(null)
	const [editRace, setEditRace] = useState('')
	const [editYear, setEditYear] = useState('')

	const handleDragStart = (e: h.JSX.TargetedDragEvent<HTMLDivElement>, familyId: number) => {
		setDraggingId(familyId)
		e.dataTransfer.effectAllowed = 'move'
		e.dataTransfer.setData('familyId', familyId.toString())
		if (onDragStart) onDragStart(familyId)
	}

	const handleDragEnd = () => {
		setDraggingId(null)
		if (onDragEnd) onDragEnd()
	}

	if (!families || families.length === 0) {
		return (
			<div
				className={`${styles.queenSlot} ${styles.empty} ${editable ? styles.editable : ''}`}
				onClick={editable ? onAddQueen : undefined}
			>
				<div className={styles.emptyText}>
					{editable ? (
						<>
							<PlusIcon size={20} />
							<T>Add Queen</T>
						</>
					) : (
						<T>No queen in this hive</T>
					)}
				</div>
			</div>
		)
	}

	return (
		<div>
			{families.length > 1 && editable && (
				<div className={styles.multipleWarning}>
					<T>Multiple Queens</T> ({families.length})
				</div>
			)}

			<div className={styles.queensContainer}>
				<div className={styles.queensList}>
					{families.map((family) => (
				<div
					key={family.id}
					className={`${styles.queenSlot} ${styles.filled} ${editable ? styles.editable : ''} ${
						draggingId === family.id ? styles.dragging : ''
					} ${families.length > 1 ? styles.multiple : ''}`}
					draggable={editable}
					onDragStart={(e) => editable ? handleDragStart(e, family.id) : undefined}
					onDragEnd={editable ? handleDragEnd : undefined}
				>
					<div className={styles.queenInfo}>
						<div className={styles.queenIcon}>
							<QueenIcon size={28} />
						</div>
						<div className={styles.queenDetails}>
							<QueenColor year={editingId === family.id ? editYear : family.added} />
							{editable && editingId === family.id ? (
								<>
									<input
										type="text"
										className={styles.raceInput}
										value={editRace}
										onChange={(e: any) => setEditRace(e.target.value)}
										onBlur={() => {
											if (onUpdateQueen) {
												onUpdateQueen(family.id, editRace, editYear)
											}
											setEditingId(null)
										}}
										onKeyDown={(e: any) => {
											if (e.key === 'Enter') {
												if (onUpdateQueen) {
													onUpdateQueen(family.id, editRace, editYear)
												}
												setEditingId(null)
											}
										}}
										placeholder="Race"
										autoFocus
									/>
									<input
										type="text"
										className={styles.yearInput}
										value={editYear}
										onChange={(e: any) => setEditYear(e.target.value)}
										onBlur={() => {
											if (onUpdateQueen) {
												onUpdateQueen(family.id, editRace, editYear)
											}
											setEditingId(null)
										}}
										onKeyDown={(e: any) => {
											if (e.key === 'Enter') {
												if (onUpdateQueen) {
													onUpdateQueen(family.id, editRace, editYear)
												}
												setEditingId(null)
											}
										}}
										placeholder="Year"
										maxLength={4}
									/>
								</>
							) : (
								<>
									<span
										className={styles.queenRace}
										onClick={() => {
											if (editable && onUpdateQueen) {
												setEditingId(family.id)
												setEditRace(family.race || '')
												setEditYear(family.added || '')
											}
										}}
										style={{ cursor: editable ? 'pointer' : 'default' }}
									>
										{family.race || <T>Unknown Race</T>}
									</span>
									<span
										className={styles.queenYear}
										onClick={() => {
											if (editable && onUpdateQueen) {
												setEditingId(family.id)
												setEditRace(family.race || '')
												setEditYear(family.added || '')
											}
										}}
										style={{ cursor: editable ? 'pointer' : 'default' }}
									>
										{family.added || <T>Unknown Year</T>}
										{family.age && <> ({family.age} <T>years</T>)</>}
									</span>
								</>
							)}
						</div>
					</div>

					{editable && (
						<div className={styles.queenActions}>
							<Button
								className={`${styles.actionButton} ${styles.remove}`}
								onClick={(e) => {
									e.stopPropagation()
									if (confirm('Are you sure you want to remove this queen from the hive?')) {
										onRemoveQueen(family.id)
									}
								}}
								title="Remove queen"
								iconOnly={true}
							>
								<TrashIcon size={20} />
							</Button>
						</div>
					)}
					</div>
				))}
				</div>

				{showAddButton && (
					<Button
						type="button"
						className={styles.addAnotherButton}
						onClick={(e) => {
							e.preventDefault()
							e.stopPropagation()
							onAddQueen()
						}}
						title="Add another queen"
					>
						<PlusIcon size={14} />
						<span>Add</span>
					</Button>
				)}
			</div>
		</div>
	)
}

