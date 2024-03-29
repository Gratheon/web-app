import React from 'react'

import HiveIcon from '@/components/shared/hiveIcon'
import Button from '@/components/shared/button'
import HivesPlaceholder from '@/components/shared/hivesPlaceholder'
import T from '@/components/shared/translate'

import AddHiveIcon from '@/icons/addHive'
import HandIcon from '@/icons/handIcon'

import styles from './index.less'

export default function apiaryListRow(props) {
	const { apiary } = props

	return (
		<div className={styles.apiary}>
			<div className={styles.apiaryHead}>
				<h2>{apiary.name ? apiary.name : '...'}</h2>
				<div className={styles.buttons}>
					<Button href={`/apiaries/edit/${apiary.id}`}>
						<HandIcon /><span><T ctx="button to change beehive">Edit</T></span>
					</Button>
					<Button href={`/apiaries/${apiary.id}/hives/add`}>
						<AddHiveIcon /><span><T ctx="button to add beehive">Add hive</T></span>
					</Button>
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
							{hive.beeCount && <>🐝{hive.beeCount} </> }
						</div>
					))}
			</div>
		</div>
	)
}
