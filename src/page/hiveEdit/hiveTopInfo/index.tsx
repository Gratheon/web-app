import React, { useMemo, useState } from 'react'
import debounce from 'lodash/debounce'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'

import T from '@/shared/translate'
import HiveIcon from '@/shared/hive'

import { useMutation } from '@/api'

import InspectionIcon from '@/icons/inspection.tsx'
import Loader from '@/shared/loader'
import Button from '@/shared/button'
import { PopupButton, PopupButtonGroup } from '@/shared/popupButton'
import { InspectionSnapshot } from '@/models/inspections.ts'
import BeeCounter from '@/shared/beeCounter'
import MessageSuccess from '@/shared/messageSuccess'
import VisualFormSubmit from '@/shared/visualForm/VisualFormSubmit'

import { updateHive, getHive } from '@/models/hive.ts'
import { getBoxes } from '@/models/boxes.ts'
import { getFamilyByHive } from '@/models/family.ts'
import {
	getHiveInspectionStats,
	deleteCellsByFrameSideIDs,
} from '@/models/frameSideCells.ts'
import { getFramesByHive } from '@/models/frames.ts'
import { collectFrameSideIDsFromFrames } from '@/models/frameSide.ts'
import { deleteFilesByFrameSideIDs } from '@/models/frameSideFile.ts'

import DeactivateButton from '@/page/hiveEdit/deleteButton'
import QueenColor from '@/page/hiveEdit/hiveTopInfo/queenColor'
import styles from '@/page/hiveEdit/hiveTopInfo/styles.module.less'

import HiveTopEditForm from '@/page/hiveEdit/hiveTopInfo/hiveTopEditForm'

export default function HiveEditDetails({ apiaryId, hiveId }) {
	let [editable, setEditable] = useState(false)
	let [creatingInspection, setCreatingInspection] = useState(false)
	let [okMsg, setOkMsg] = useState(null)
	let navigate = useNavigate()

	// Model functions now handle invalid IDs
	let hive = useLiveQuery(() => getHive(+hiveId), [hiveId]);
	let boxes = useLiveQuery(() => getBoxes({ hiveId: +hiveId }), [hiveId]);
	let family = useLiveQuery(() => getFamilyByHive(+hiveId), [hiveId]);

	let [mutateInspection, { error: errorInspection }] =
		useMutation(`	mutation addInspection($inspection: InspectionInput!) {
		addInspection(inspection: $inspection) {
			id
		}
	}`)
	let [cloneFramesForInspection, { error: errorInspection2 }] =
		useMutation(`mutation cloneFramesForInspection($frameSideIDs: [ID], $inspectionId: ID!) {
		cloneFramesForInspection(frameSideIDs: $frameSideIDs, inspectionId: $inspectionId)
	}`)

	function goToHiveView(event) {
		event.stopPropagation()
		navigate(`/apiaries/${apiaryId}/hives/${hiveId}`, {
			replace: true,
		})
	}

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
					cellStats,
				}

				let createdInspection = await mutateInspection({
					inspection: {
						hiveId: +hiveId,
						data: JSON.stringify(inspectionSnapshot),
					},
				})

				await cloneFramesForInspection({
					inspectionId: createdInspection.data.addInspection.id,
					frameSideIDs,
				})

				deleteCellsByFrameSideIDs(frameSideIDs)
				deleteFilesByFrameSideIDs(frameSideIDs)

				hive.inspectionCount = hive.inspectionCount + 1
				updateHive(hive)
				setCreatingInspection(false)

				setOkMsg(
					<MessageSuccess
						title={<T>Inspection created</T>}
						message={
							<>
							<T>All frame statistics is reset for the new state</T>.
							<T>Try sharing the inspection with others</T>!
							</>
					}
					/>
				)
			}, 1000),
		[]
	)

	if (!hive) {
		return <Loader />
	}

	let buttons = (
		<div>
			<VisualFormSubmit>
				<Button
					loading={creatingInspection}
					onClick={onCreateInspection}
					color="green"
				>
					<InspectionIcon />
					<T ctx="This is a button that adds new beehive inspection as a snapshot of current beehive state">
						Create Inspection
					</T>
				</Button>
				<PopupButtonGroup>
					{!editable && (
						<Button onClick={() => setEditable(!editable)}>
							<T ctx="this is a button to allow editing by displaying a form">
								Edit
							</T>
						</Button>
					)}
					{editable && (
						<Button onClick={() => setEditable(!editable)}>
							<T ctx="this is a button to compete editing of a form, but it is not doing any saving because saving is done automatically, this just switches form to view mode">
								Complete
							</T>
						</Button>
					)}

					<PopupButton align="right">
						<DeactivateButton hiveId={hive.id} />
					</PopupButton>
				</PopupButtonGroup>
			</VisualFormSubmit>
		</div>
	)

	if (!editable) {
		return (
			<div style="padding: 0 10px;">
				{okMsg}

				<div className={styles.horizontal_wrap}>
					<div className={styles.icon_wrap}>
						<HiveIcon boxes={boxes} />
						<BeeCounter count={hive.beeCount} />
					</div>

					<div className={styles.name_race_wrap}>
						<div className={styles.wrap4}>
							<h1 style="flex-grow:1; cursor: pointer" onClick={goToHiveView}>
								{hive.name}
							</h1>
						</div>

						<div id={styles.raceYear}>
							{family && family.race}

							{family && family.race && family.added && (
								<QueenColor year={family?.added} />
							)}
							{family && family.added}
						</div>

						{!family && (
							<MessageSuccess
								title={<T>This hive has no family set yet</T>}
								isWarning={true}
							/>
						)}

						{hive.notes && <p>{hive.notes}</p>}
					</div>

					<div className={styles.button_wrap1}>{buttons}</div>
				</div>

				<div className={styles.button_wrap2}>{buttons}</div>
			</div>
		)
	}

	return (
		<HiveTopEditForm apiaryId={apiaryId} hiveId={hiveId} buttons={buttons} />
	)
}
