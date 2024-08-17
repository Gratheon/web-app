import React, { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'

import { useQuery } from '../../api'
import Boxes from './boxes'

import HIVE_QUERY from './_api/hiveQuery.graphql.ts'
import HiveEditDetails from './hiveTopInfo'

import ErrorMsg from '../../shared/messageError'
import ErrorGeneral from '../../shared/messageErrorGlobal'
import { boxTypes, getBox } from '../../models/boxes.ts'
import { getHive } from '../../models/hive.ts'
import { getApiary } from '../../models/apiary.ts'
import Loader from '../../shared/loader'

import Frame from './frame'
import GateBox from './gateBox/GateBox.tsx'
import MessageNotFound from '../../shared/messageNotFound'
import HiveAdvisor from './hiveAdvisor'
import BreadCrumbs from '../../shared/breadcrumbs'
import SubMenu from '../../shared/submenu'
import T from '../../shared/translate'
import MessageSuccess from '../../shared/messageSuccess'
import HiveIcon from '../../icons/hive.tsx'
import HiveButtons from './boxes/hiveButtons.tsx'
import Button from '../../shared/button'
import ListIcon from '../../icons/listIcon.tsx'
import TableIcon from '../../icons/tableIcon.tsx'

import styles from './styles.module.less'
import Treatments from './treatments'
import { getFamilyByHive } from '../../models/family.ts'

export default function HiveEditForm() {
	const { state } = useLocation();
	const [displayMode, setDisplayMode] = useState('list')

	let { apiaryId, hiveId, boxId, frameId, frameSideId } = useParams()
	let [error, onError] = useState(null)
	const navigate = useNavigate()

	const apiary = useLiveQuery(() => getApiary(+apiaryId), [apiaryId], null)
	const hive = useLiveQuery(() => getHive(+hiveId), [hiveId], null)
	const box = useLiveQuery(() => getBox(+boxId), [boxId], null)
	const family = useLiveQuery(() => getFamilyByHive(+hiveId), [hiveId])

	if (apiary === null || hive === null) {
		return <Loader />
	}

	let loading,
		errorGet,
		errorNetwork

	// if local cache is empty - query
	if (!apiary || !hive || !hive.inspectionCount) {
		({
			loading,
			error: errorGet,
			errorNetwork
		} = useQuery(HIVE_QUERY, { variables: { id: +hiveId, apiaryId: +apiaryId } }))

		if (loading) {
			return <Loader />
		}

		if (!hive) {
			return <MessageNotFound msg={<T>Hive not found</T>}>
				<div><T ctx="this is a not-found error message">Hive was either deleted, never existed or we have a navigation or backend error. You can create new hive from apiary list view</T></div>
			</MessageNotFound>
		}
	}

	// inline error from deeper components
	let errorMsg = <ErrorMsg error={error || errorGet || errorNetwork} />


	let breadcrumbs = []

	if (apiary) {
		breadcrumbs[0] = {
			name: <>«{apiary.name}» <T>apiary</T></>,
			uri: `/apiaries/edit/${apiaryId}`,
		}
	}


	if (hive) {
		breadcrumbs[1] = {
			icon: <HiveIcon size={12} />,
			name: <>«{hive.name}» <T>hive</T></>,
			uri: `/apiaries/${apiaryId}/hives/${hiveId}`,
		}
	}

	if (box) {
		if (box.type === boxTypes.GATE) {
			breadcrumbs.push({
				'name': <>{box.id} <T ctx="this is part of the beehive where bees enter or exit">entrance</T></>,
				uri: `/apiaries/${apiaryId}/hives/${hiveId}/box/${boxId}`,
			})
		} else {
			breadcrumbs.push({
				'name': <>{box.id} <T ctx="this is a box or a section of the vertical beehive">section</T></>,
				uri: `/apiaries/${apiaryId}/hives/${hiveId}/box/${boxId}`,
			})
		}
	}

	if (frameId) {
		breadcrumbs.push({
			'name': <>{frameId} <T ctx="this is internal wooden part of the beehive where bees have comb and store honey or keep eggs or larvae">frame</T></>,
			uri: `/apiaries/${apiaryId}/hives/${hiveId}/box/${boxId}/frame/${frameId}`,
		})
	}


	function onBoxClose(event) {
		event.stopPropagation()
		navigate(`/apiaries/${apiaryId}/hives/${hiveId}`, {
			replace: true,
		})
	}

	return (
		<div>
			<ErrorGeneral />

			{errorMsg}
			{state && <MessageSuccess title={<T>{state.title}</T>} message={<T>{state.message}</T>} />}

			<BreadCrumbs items={breadcrumbs}>
				<SubMenu
					currentUrl={`/apiaries/${apiaryId}/hives/${hiveId}`}
					inspectionsUrl={`/apiaries/${apiaryId}/hives/${hiveId}/inspections`}
					inspectionCount={hive.inspectionCount}
				/>
			</BreadCrumbs>

			<HiveEditDetails apiaryId={apiaryId} hiveId={hiveId} />

			<div className={styles.boxesFrameWrap}>
				<div className={styles.boxesWrap}>
					<Boxes
						onError={onError}
						apiaryId={apiaryId}
						hiveId={hiveId}
						boxId={boxId}
						frameId={frameId}
						frameSideId={frameSideId}
						displayMode={displayMode}
						setDisplayMode={setDisplayMode}
					/>
				</div>

				<div className={styles.frameWrap}>
					{!frameId && !boxId && <HiveButtons apiaryId={apiaryId} hiveId={hiveId} />}


					{!frameId && family && <Treatments hiveId={hiveId} boxId={boxId} />}

					<Frame
						box={box}

						apiaryId={apiaryId}
						boxId={boxId}
						frameId={frameId}
						hiveId={hiveId}
						frameSideId={frameSideId}
						extraButtons={<Button onClick={onBoxClose}><T>Close</T></Button>}
					/>

					{!frameId && !box && <HiveAdvisor
						apiary={apiary}
						hive={hive}
						hiveId={hiveId} />}

					{box && box.type === boxTypes.GATE &&
						<GateBox boxId={boxId} />
					}

					{boxId && !frameId &&
						<div style={{ display: 'flex', flexDirection: 'row-reverse', flexGrow: 1 }}>
							<Button onClick={onBoxClose}><T>Close</T></Button>
						</div>}
				</div>
			</div>
		</div>
	)
}
