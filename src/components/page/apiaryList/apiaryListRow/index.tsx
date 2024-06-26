import React from 'react'

import Hive from '@/components/shared/hive'
import Button from '@/components/shared/button'
import HivesPlaceholder from '@/components/shared/hivesPlaceholder'
import T from '@/components/shared/translate'

import HiveIcon from '@/components/icons/hive'
import HandIcon from '@/components/icons/handIcon'

import styles from './index.less'
import BeeCounter from '@/components/shared/beeCounter'
import { NavLink } from 'react-router-dom'
import Link from '@/components/shared/link'
import ListIcon from '@/components/icons/listIcon'
import TableIcon from '@/components/icons/tableIcon'

export default function apiaryListRow(props) {
	const { apiary } = props
	const [listType, setListType] = React.useState(localStorage.getItem('apiaryListType.' + apiary.id) || 'list')

	return (
		<div className={styles.apiary}>
			<div className={styles.apiaryHead}>
				<h2><Link href={`/apiaries/edit/${apiary.id}`}>{apiary.name ? apiary.name : '...'}</Link></h2>
				<div className={styles.buttons}>
					{listType == 'table' && apiary.hives.length>0 && <Button onClick={() => {
						setListType('list')
						localStorage.setItem('apiaryListType.' + apiary.id, 'list')
					}}>
						<ListIcon />
					</Button>}

					{listType == 'list' && apiary.hives.length>0 && <Button onClick={() => {
						setListType('table')
						localStorage.setItem('apiaryListType.' + apiary.id, 'table')
					}}>
						<TableIcon />
					</Button>}

					<Button href={`/apiaries/${apiary.id}/hives/add`}
						color={apiary.hives.length == 0 ? 'green' : 'white'}>
						<HiveIcon /><span><T ctx="button to add beehive">Add hive</T></span>
					</Button>
				</div>
			</div>

			<div className={styles.hives}>
				{apiary.hives && apiary.hives.length == 0 && <HivesPlaceholder />}
				{listType == 'list' && apiary.hives &&
					apiary.hives.map((hive, i) => (
						<div key={i} className={styles.hive}>
							<NavLink to={`/apiaries/${apiary.id}/hives/${hive.id}`}>
								<Hive boxes={hive.boxes} size={60} />
								<div className={styles.title}>{hive.name}</div>
							</NavLink>

							<BeeCounter count={hive.beeCount} />
						</div>
					))}

				{listType == 'table' && apiary.hives.length > 0 &&
					<table>
						<thead>
							<tr>
								<th><T ctx="table header">Hive</T></th>
								<th><T ctx="table header">Name</T></th>
								<th><T ctx="table header">Bees</T></th>
							</tr>
						</thead>
						<tbody>
							{apiary.hives &&
								apiary.hives.map((hive, i) => (
									<tr key={i}>
										<td>
											<NavLink to={`/apiaries/${apiary.id}/hives/${hive.id}`}>
												<Hive boxes={hive.boxes} size={20} />
											</NavLink>
										</td>
										<td>
											<div className={styles.title}>{hive.name}</div>
										</td>

										<td>
											<BeeCounter count={hive.beeCount} />
										</td>
									</tr>
								))}
						</tbody>
					</table>
				}
			</div>
		</div>
	)
}
