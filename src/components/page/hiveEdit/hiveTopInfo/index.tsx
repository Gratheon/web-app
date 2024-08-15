import React, { useMemo, useState } from 'react'
import debounce from 'lodash/debounce'
import { useLiveQuery } from 'dexie-react-hooks'

import T from '../../../shared/translate'
import HiveIcon from '../../../shared/hive'
import DeactivateButton from '../deleteButton'
import QueenColor from './queenColor'
import styles from './styles.module.less'

import { useMutation } from '../../../api'
import { updateHive, getHive } from '../../../models/hive.ts'
import { getBoxes } from '../../../models/boxes.ts'
import { getFamilyByHive } from '../../../models/family.ts'

import Loader from '../../../shared/loader'
import Button from '../../../shared/button'
import { PopupButton, PopupButtonGroup } from '../../../shared/popupButton'
import { InspectionSnapshot } from '../../../models/inspections.ts'
import { getFramesByHive } from '../../../models/frames.ts'
import { getHiveInspectionStats, deleteCellsByFrameSideIDs } from '../../../models/frameSideCells.ts'
import BeeCounter from '../../../shared/beeCounter'
import { collectFrameSideIDsFromFrames } from '../../../models/frameSide.ts'
import { deleteFilesByFrameSideIDs } from '../../../models/frameSideFile.ts'
import MessageSuccess from '../../../shared/messageSuccess'
import InspectionIcon from '../../../icons/inspection.tsx'
import VisualFormSubmit from '../../../shared/visualForm/VisualFormSubmit'
import HiveTopEditForm from './hiveTopEditForm'

export default function HiveEditDetails({ apiaryId, hiveId }) {
	let [editable, setEditable] = useState(false)
	let [creatingInspection, setCreatingInspection] = useState(false)
	let [okMsg, setOkMsg] = useState(null)

	let hive = useLiveQuery(() => getHive(+hiveId), [hiveId])
	let boxes = useLiveQuery(() => getBoxes({ hiveId: +hiveId }), [hiveId])
	let family = useLiveQuery(() => getFamilyByHive(+hiveId), [hiveId])

	let [mutateInspection, { error: errorInspection }] = useMutation(`	mutation addInspection($inspection: InspectionInput!) {
		addInspection(inspection: $inspection) {
			id
		}
	}`)
	let [cloneFramesForInspection, { error: errorInspection2 }] = useMutation(`mutation cloneFramesForInspection($frameSideIDs: [ID], $inspectionId: ID!) {
		cloneFramesForInspection(frameSideIDs: $frameSideIDs, inspectionId: $inspectionId)
	}`)

	const onCreateInspection = useMemo(
		() =>
			debounce(async function (v) {
				setCreatingInspection(true)

				let hive = await getHive(+hiveId)
				let boxes = await getBoxes({ hiveId: +hiveId })
				let family = await getFamilyByHive(+hiveId)
				let frames = await getFramesByHive(+hiveId)
				let frameSideIDs = collectFrameSideIDsFromFrames(frames)
				let cellStats = await getHiveInspectionStats(frames)

				let inspectionSnapshot: InspectionSnapshot = {
					hive,
					family,
					boxes,
					frames,
					cellStats
				}

				let createdInspection = await mutateInspection({
					inspection: {
						hiveId: +hiveId,
						data: JSON.stringify(inspectionSnapshot)
					},
				})

				await cloneFramesForInspection({
					inspectionId: createdInspection.data.addInspection.id,
					frameSideIDs
				}
				)

				deleteCellsByFrameSideIDs(frameSideIDs)
				deleteFilesByFrameSideIDs(frameSideIDs)

				hive.inspectionCount = hive.inspectionCount + 1
				updateHive(hive)
				setCreatingInspection(false)

				setOkMsg(
					<MessageSuccess title={<T>Inspection created</T>} message={<T>All frame statistics is reset for the new state</T>} />
				)

			}, 1000),
		[]
	)

	if (!hive) {
		return <Loader />
	}


	let buttons = (
		<VisualFormSubmit>

			<Button loading={creatingInspection} onClick={onCreateInspection} color="green">
				<InspectionIcon />
				<T ctx="This is a button that adds new beehive inspection as a snapshot of current beehive state">Create Inspection</T>
			</Button>

			<PopupButtonGroup>

				{!editable && <Button onClick={() => setEditable(!editable)}><T ctx="this is a button to allow editing by displaying a form">Edit</T></Button>}
				{editable && <Button onClick={() => setEditable(!editable)}><T ctx="this is a button to compete editing of a form, but it is not doing any saving because saving is done automatically, this just switches form to view mode">Complete</T></Button>}

				<PopupButton align="right">
					<DeactivateButton hiveId={hive.id} />
				</PopupButton>
			</PopupButtonGroup>
		</VisualFormSubmit>)

	if (!editable) {
		return (
			<div>

				{okMsg}

				<div className={styles.wrap2}>
					<div className={styles.wrap3}>
						<HiveIcon boxes={boxes} />
						<BeeCounter count={hive.beeCount} />
					</div>
					<div className={styles.wrap5}>
						<div className={styles.wrap4}>
							<h1 style="flex-grow:1">{hive.name}</h1>

							{buttons}
						</div>


						<div id={styles.raceYear}>
							{family && family.race}

							{family && family.race && family.added && <QueenColor year={family?.added} />}
							{family && family.added}
						</div>

						{!family && <MessageSuccess title={<T>This hive has no family set yet</T>} isWarning={true} />}

						{hive.notes && <p>{hive.notes}</p>}
					</div>
				</div>
			</div>
		)
	}

	return <HiveTopEditForm
		apiaryId={apiaryId}
		hiveId={hiveId}
		buttons={buttons} />
}
