import React from 'react'

import HiveIcon from '../../../shared/hiveIcon'
import Link from '../../../shared/link'
import HivesPlaceholder from '../../../shared/hivesPlaceholder'
import AddHiveIcon from '../../../../icons/addHive'
import HandIcon from '../../../../icons/handIcon'
import styles from './index.less'

export default function apiaryListRow(props) {
	const { apiary } = props

	return (
		<div className={styles.apiary}>
			<div className={styles.apiaryHead}>
				<h2>{apiary.name ? apiary.name : '...'}</h2>
				<div
					style={{
						marginTop: 15,
					}}
				>
					<Link href={`/apiaries/edit/${apiary.id}`}>
						<HandIcon /> Edit
					</Link>
					<Link href={`/apiaries/${apiary.id}/hives/add`}>
						<AddHiveIcon /> Add hive
					</Link>
				</div>
			</div>

			<div className={styles.hives}>
				{apiary.hives && apiary.hives.length == 0 && <HivesPlaceholder />}
				{apiary.hives &&
					apiary.hives.map((hive, i) => (
						<div key={i} className={styles.hive}>
							<a href={`/apiaries/${apiary.id}/hives/${hive.id}`}>
								<HiveIcon boxes={hive.boxes} size={60} />
								<div className={styles.title}>{hive.name}</div>
							</a>
						</div>
					))}
			</div>
		</div>
	)
}
