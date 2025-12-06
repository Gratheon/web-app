import { h } from 'preact'
import { useState } from 'preact/hooks'
import T from '@/shared/translate'
import styles from './WarehouseDropZone.module.less'

interface WarehouseDropZoneProps {
	visible: boolean
	onDrop: (familyId: number) => void
}

export default function WarehouseDropZone({ visible, onDrop }: WarehouseDropZoneProps) {
	const [isOver, setIsOver] = useState(false)

	const handleDragOver = (e: h.JSX.TargetedDragEvent<HTMLDivElement>) => {
		e.preventDefault()
		e.dataTransfer.dropEffect = 'move'
		setIsOver(true)
	}

	const handleDragLeave = () => {
		setIsOver(false)
	}

	const handleDrop = (e: h.JSX.TargetedDragEvent<HTMLDivElement>) => {
		e.preventDefault()
		setIsOver(false)
		const familyId = e.dataTransfer.getData('familyId')
		if (familyId) {
			onDrop(+familyId)
		}
	}

	if (!visible) return null

	return (
		<div
			className={`${styles.warehouseZone} ${isOver ? styles.over : ''}`}
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
		>
			<div className={styles.warehouseContent}>
				<div className={styles.warehouseText}>
					<span className={styles.warehouseIcon}>📦</span>
					<T>Warehouse</T>
				</div>
				<div className={styles.warehouseHint}>
					<T>Drop queen here to store for later use</T>
				</div>
			</div>
		</div>
	)
}

