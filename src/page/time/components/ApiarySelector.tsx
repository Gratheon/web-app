import styles from './ApiarySelector.module.less'
import T, { usePlural } from '@/shared/translate'

interface Apiary {
	id: string
	name: string
	hives?: Array<{ id: string }>
}

interface ApiarySelectorProps {
	apiaries: Apiary[]
	selectedApiaryId: string | null
	onSelectApiary: (apiaryId: string) => void
}

export default function ApiarySelector({ apiaries, selectedApiaryId, onSelectApiary }: ApiarySelectorProps) {
	if (apiaries.length <= 1) return null

	return (
		<div className={styles.panel}>
			<div className={styles.header}>
				<strong className={styles.title}><T>Apiary</T>:</strong>
			</div>
			<div className={styles.apiaryList}>
				{apiaries.map(apiary => {
					const isSelected = selectedApiaryId === apiary.id
					const hiveCount = apiary.hives?.length || 0
					return (
						<label
							key={apiary.id}
							className={`${styles.apiaryOption} ${isSelected ? styles.selected : ''}`}
						>
							<input
								type="radio"
								name="apiary"
								checked={isSelected}
								onChange={() => onSelectApiary(apiary.id)}
							/>
							<span className={styles.apiaryName}>{apiary.name || `Apiary ${apiary.id}`}</span>
							<span className={styles.hiveCount}>({hiveCount} <HiveLabel count={hiveCount} />)</span>
						</label>
					)
				})}
			</div>
		</div>
	)
}

function HiveLabel({ count }: { count: number }) {
	const label = usePlural(count, 'hive')
	return <>{label}</>
}

