import React from 'react'

import Hive from '@/components/shared/hive'
import Button from '@/components/shared/button'
import HivesPlaceholder from '@/components/shared/hivesPlaceholder'
import T from '@/components/shared/translate'

import HiveIcon from '@/icons/hive'
import HandIcon from '@/icons/handIcon'

import styles from './index.less'
import BeeCounter from '@/components/shared/beeCounter'
import { NavLink } from 'react-router-dom'

export default function apiaryListRow(props) {
	const { apiary } = props
	const [listType, setListType] = React.useState(localStorage.getItem('apiaryListType.' + apiary.id) || 'list')

	return (
		<div className={styles.apiary}>
			<div className={styles.apiaryHead}>
				<h2>{apiary.name ? apiary.name : '...'}</h2>
				<div className={styles.buttons}>
					<Button onClick={() => {
						setListType('list')
						localStorage.setItem('apiaryListType.' + apiary.id, 'list')
					}}>
						<svg height="16" width="16" fill="white" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path d="M8 28h8v-8H8v8zm0 10h8v-8H8v8zm0-20h8v-8H8v8zm10 10h24v-8H18v8zm0 10h24v-8H18v8zm0-28v8h24v-8H18z" /><path d="M0 0h48v48H0z" fill="none" /></svg>
					</Button>
					<Button onClick={() => {
						setListType('table')
						localStorage.setItem('apiaryListType.' + apiary.id, 'table')
					}}>
						<svg height="16" width="16" fill="white" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M576 1376v-192q0-14-9-23t-23-9h-320q-14 0-23 9t-9 23v192q0 14 9 23t23 9h320q14 0 23-9t9-23zm0-384v-192q0-14-9-23t-23-9h-320q-14 0-23 9t-9 23v192q0 14 9 23t23 9h320q14 0 23-9t9-23zm512 384v-192q0-14-9-23t-23-9h-320q-14 0-23 9t-9 23v192q0 14 9 23t23 9h320q14 0 23-9t9-23zm-512-768v-192q0-14-9-23t-23-9h-320q-14 0-23 9t-9 23v192q0 14 9 23t23 9h320q14 0 23-9t9-23zm512 384v-192q0-14-9-23t-23-9h-320q-14 0-23 9t-9 23v192q0 14 9 23t23 9h320q14 0 23-9t9-23zm512 384v-192q0-14-9-23t-23-9h-320q-14 0-23 9t-9 23v192q0 14 9 23t23 9h320q14 0 23-9t9-23zm-512-768v-192q0-14-9-23t-23-9h-320q-14 0-23 9t-9 23v192q0 14 9 23t23 9h320q14 0 23-9t9-23zm512 384v-192q0-14-9-23t-23-9h-320q-14 0-23 9t-9 23v192q0 14 9 23t23 9h320q14 0 23-9t9-23zm0-384v-192q0-14-9-23t-23-9h-320q-14 0-23 9t-9 23v192q0 14 9 23t23 9h320q14 0 23-9t9-23zm128-320v1088q0 66-47 113t-113 47h-1344q-66 0-113-47t-47-113v-1088q0-66 47-113t113-47h1344q66 0 113 47t47 113z" /></svg>
					</Button>


					<Button href={`/apiaries/edit/${apiary.id}`}>
						<HandIcon /><span><T ctx="button to change beehive">Edit</T></span>
					</Button>
					<Button href={`/apiaries/${apiary.id}/hives/add`}>
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
