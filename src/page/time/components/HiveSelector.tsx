import styles from './HiveSelector.module.less'
import T, { useTranslation as t } from '@/shared/translate'

interface HiveSelectorProps {
	hives: Array<{ id: string; name: string; hiveNumber?: number }>
	selectedHiveIds: string[]
	onToggleHive: (hiveId: string) => void
}

export default function HiveSelector({ hives, selectedHiveIds, onToggleHive }: HiveSelectorProps) {
	const shouldScroll = hives.length > 6
	const hiveLabel = t('Hive')

	return (
		<div className={styles.panel}>
			<div className={styles.header}>
				<strong className={styles.title}><T>Selected Hives</T>:</strong>
			</div>
			<div className={`${styles.hiveList} ${shouldScroll ? styles.scrollable : ''}`}>
				{hives.map(hive => {
					const isSelected = selectedHiveIds.length === 0 || selectedHiveIds.includes(hive.id)
					return (
						<label
							key={hive.id}
							className={`${styles.hiveCheckbox} ${isSelected ? styles.selected : ''}`}
						>
							<input
								type="checkbox"
								checked={isSelected}
								onChange={() => onToggleHive(hive.id)}
							/>
							<span>{hive.hiveNumber ? `${hiveLabel} #${hive.hiveNumber}` : `${hiveLabel} ${hive.id}`}</span>
						</label>
					)
				})}
			</div>
		</div>
	)
}

