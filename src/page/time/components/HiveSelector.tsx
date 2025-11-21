import styles from './HiveSelector.module.less'

interface HiveSelectorProps {
	hives: Array<{ id: string; name: string }>
	selectedHiveIds: string[]
	onToggleHive: (hiveId: string) => void
	onToggleAll: () => void
}

export default function HiveSelector({ hives, selectedHiveIds, onToggleHive, onToggleAll }: HiveSelectorProps) {
	return (
		<div className={styles.panel}>
			<div className={styles.header}>
				<strong className={styles.title}>Selected Hives:</strong>
				<button onClick={onToggleAll} className={styles.selectAllButton}>
					{selectedHiveIds.length === hives.length ? 'Deselect All' : 'Select All'}
				</button>
			</div>
			<div className={styles.hiveList}>
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
							<span>{hive.name || `Hive ${hive.id}`}</span>
						</label>
					)
				})}
			</div>
		</div>
	)
}

