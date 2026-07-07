import Hive from '../../../shared/hive'
import BeeCounter from '../../../shared/beeCounter'
import { NavLink } from 'react-router-dom'

import { getHiveFamilies } from '../hivePresentation'
import styles from './index.module.less'

export default function HiveListView({
	apiaryId,
	onSelectHive,
	registerHiveItem,
	selectedHiveApiaryId,
	selectedHiveId,
	sortedHives,
}) {
	return (
		<>
			{sortedHives &&
				sortedHives.map((hive, i) => {
					const isHorizontalHive = (hive?.boxes || []).some(
						(box) => box?.type === 'LARGE_HORIZONTAL_SECTION'
					)
					return (
						<div
							key={i}
							className={`${styles.hive} ${
								isHorizontalHive ? styles.horizontalHive : ''
							} ${hive.status === 'collapsed' ? styles.collapsedHive : ''} ${
								hive.status === 'merged' ? styles.mergedHive : ''
							} ${
								selectedHiveApiaryId === apiaryId && selectedHiveId === hive.id
									? styles.selectedHive
									: ''
							}`}
							data-hive-item="1"
							data-apiary-id={apiaryId}
							data-hive-id={hive.id}
							ref={(element) => registerHiveItem(hive.id, element)}
							onMouseEnter={() => onSelectHive(apiaryId, hive.id)}
							onClick={() => onSelectHive(apiaryId, hive.id)}
						>
							<NavLink to={`/apiaries/${apiaryId}/hives/${hive.id}`}>
								<Hive boxes={hive.boxes} size={60} hiveType={hive.hiveType} />
								<div className={styles.title}>
									{hive.hiveNumber && <span>#{hive.hiveNumber} </span>}
									{getHiveFamilies(hive)[0]?.name || hive.name || 'Unnamed'}
								</div>
							</NavLink>

							<BeeCounter count={hive.beeCount} />
						</div>
					)
				})}
		</>
	)
}
