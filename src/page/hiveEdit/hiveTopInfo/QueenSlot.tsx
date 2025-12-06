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
	onDragStart?: (familyId: number) => void
	onDragEnd?: () => void
	showAddButton?: boolean
}

export default function QueenSlot({
	families,
	editable,
	onAddQueen,
	onRemoveQueen,
	onDragStart,
	onDragEnd,
	showAddButton = false
}: QueenSlotProps) {
	const [draggingId, setDraggingId] = useState<number | null>(null)

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
		<div style={{ position: 'relative' }}>
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

			{families.length > 1 && editable && (
				<div className={styles.multipleWarning}>
					<T>Multiple Queens</T> ({families.length})
				</div>
			)}

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
							<QueenIcon size={32} />
						</div>
						<div className={styles.queenDetails}>
							<div className={styles.queenRace}>
								{family.race || <T>Unknown Race</T>}
							</div>
							<div className={styles.queenYear}>
								<QueenColor year={family.added} />
								{family.added || <T>Unknown Year</T>}
								{family.age && <span>({family.age} <T>years</T>)</span>}
							</div>
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
	)
}

