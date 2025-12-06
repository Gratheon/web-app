import React from 'react'

import Hive from '../../../shared/hive'
import Button from '../../../shared/button'
import HivesPlaceholder from '../../../shared/hivesPlaceholder'
import T from '../../../shared/translate'

import HiveIcon from '../../../icons/hive.tsx'

import styles from './index.module.less'
import BeeCounter from '../../../shared/beeCounter'
import { NavLink } from 'react-router-dom'
import Link from '../../../shared/link'
import ListIcon from '../../../icons/listIcon.tsx'
import TableIcon from '../../../icons/tableIcon.tsx'
import DateTimeAgo from '../../../shared/dateTimeAgo'

export default function apiaryListRow({ apiary, user }) {

	const [listType, setListType] = React.useState(localStorage.getItem('apiaryListType.' + apiary.id) || 'list')

	return (
		<div className={styles.apiary}>
			<div className={styles.apiaryHead}>
				<h2><Link href={`/apiaries/edit/${apiary.id}`}>{apiary.name ? apiary.name : '...'}</Link></h2>

				<div className={styles.buttons}>
					{listType == 'table' && apiary.hives.length > 0 && <Button onClick={() => {
						setListType('list')
						localStorage.setItem('apiaryListType.' + apiary.id, 'list')
					}}>
						<ListIcon />
					</Button>}

					{listType == 'list' && apiary.hives.length > 0 && <Button onClick={() => {
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
						<div key={i} className={`${styles.hive} ${hive.status === 'collapsed' ? styles.collapsedHive : ''} ${hive.status === 'merged' ? styles.mergedHive : ''}`}>
							<NavLink to={`/apiaries/${apiary.id}/hives/${hive.id}`}>
								<Hive boxes={hive.boxes} size={60} />
								<div className={styles.title}>
									{hive.hiveNumber && <span>#{hive.hiveNumber} </span>}
									{hive?.family?.name || hive.name || 'Unnamed'}
								</div>
							</NavLink>

							<BeeCounter count={hive.beeCount} />
						</div>
					))}

				{listType == 'table' && apiary.hives.length > 0 &&
					<table>
						<thead>
							<tr>
								<th></th>
								<th><T ctx="table header - hive number">Hive #</T></th>
								<th><T ctx="table header - queen name">Queen</T></th>
								<th><T ctx="table header of beekeeping app, start with uppercase latter">Bee count</T></th>
								<th><T ctx="table header of beekeeping app, this is a bee colony information, start with uppercase latter">Colony status</T></th>
								<th><T ctx="table header of beekeeping app, this column is about anti-varroa mite treatment, in amount of days, start with uppercase latter">Last treatment</T></th>
								<th><T ctx="table header of beekeeping app, this column is about time when hive was checked, in amount of days, start with uppercase latter">Last inspection</T></th>
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
											{hive.isNew && <span className={styles.newHive}><T ctx="new beehive">New</T></span>}
											{hive.hiveNumber || '-'}
										</td>
										<td>
											<NavLink className={styles.title} to={`/apiaries/${apiary.id}/hives/${hive.id}`}>
												{hive?.family?.name || hive.name || '-'}
											</NavLink>
										</td>

										<td>
											<BeeCounter count={hive.beeCount} />
										</td>
										<td>{hive.status}</td>
										<td>
											{hive?.family?.lastTreatment && <DateTimeAgo dateString={hive?.family?.lastTreatment} lang={user.lang} />}
										</td>
										<td>
											{hive?.lastInspection && <DateTimeAgo dateString={hive?.lastInspection} lang={user.lang} />}
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
