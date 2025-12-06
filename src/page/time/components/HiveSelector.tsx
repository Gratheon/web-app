import styles from './HiveSelector.module.less'

interface HiveSelectorProps {
	hives: Array<{ id: string; name: string; hiveNumber?: number }>
	selectedHiveIds: string[]
	onToggleHive: (hiveId: string) => void
}

export default function HiveSelector({ hives, selectedHiveIds, onToggleHive }: HiveSelectorProps) {
	const shouldScroll = hives.length > 6

	return (
		<div className={styles.panel}>
			<div className={styles.header}>
				<strong className={styles.title}>Selected Hives:</strong>
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
							<span>{hive.hiveNumber ? `Hive #${hive.hiveNumber}` : `Hive ${hive.id}`}</span>
						</label>
					)
				})}
			</div>
		</div>
	)
}

