import { useNavigate } from 'react-router'

import { useMutation } from '@/api'
import Button from '@/shared/button'
import {
	boxTypes,
	addBox,
	maxBoxPosition,
	removeBox
} from '@/models/boxes.ts'
import T from '@/shared/translate'

import AddBoxIcon from '@/icons/addBox.tsx'
import AddSuperIcon from '@/icons/addSuper.tsx'
import GateIcon from '@/icons/gate.tsx'
import ErrorMessage from '@/shared/messageError'

import { useState } from 'react'
import metrics from '@/metrics.tsx'
import styles from './styles.module.less'
import { PopupButton, PopupButtonGroup } from '@/shared/popupButton'
import DeleteIcon from '@/icons/deleteIcon'
import { useLiveQuery } from 'dexie-react-hooks'
import { getHive, isEditable } from '@/models/hive'


export default function HiveButtons({
	apiaryId,
	hiveId,
	box
}) {
	let navigate = useNavigate()
	const [adding, setAdding] = useState(false)
	const [errorRemove, setErrorRemove] = useState(false)
	const hive = useLiveQuery(() => getHive(+hiveId), [hiveId]);

	let [addBoxMutation, { error: errorAdd }] =
		useMutation(`mutation addBox($hiveId: ID!, $position: Int!, $type: BoxType!) {
	addBox(hiveId: $hiveId, position: $position, type: $type) {
		id
		position
	}
}
`)

let [removeBoxMutation] = useMutation(`mutation deactivateBox($id: ID!) {
	deactivateBox(id: $id)
}
`)

	const [removingBox, setRemovingBox] = useState(false);
	async function onBoxRemove(id: number) {
		if (confirm('Are you sure you want to remove this box?')) {
			setRemovingBox(true)
			const { error } = await removeBoxMutation({ id })

			if (error) {
				setErrorRemove(error)
				return
			}

			await removeBox(id)
			setRemovingBox(false)
			
			metrics.trackBoxRemoved()
			navigate(`/apiaries/${apiaryId}/hives/${hiveId}/`, {
				replace: true,
			})
		}
	}

	async function onBoxAdd(type) {
		setAdding(true)
		let position = (await maxBoxPosition(+hiveId)) + 1

		const {
			data: {
				addBox: { id },
			},
		} = await addBoxMutation({
			hiveId: +hiveId,
			position,
			type,
		})

		await addBox({
			id: +id,
			hiveId: +hiveId,
			position,
			type,
		})

		setAdding(false)

		metrics.trackBoxCreated()
		navigate(`/apiaries/${apiaryId}/hives/${hiveId}/box/${id}`, {
			replace: true,
		})
	}

	if(hive && !isEditable(hive)){
		return null
	}

	return (
		<>
			<ErrorMessage error={errorAdd || errorRemove} />
			<div className={styles.hiveButtons}>

				<Button
					title="Add box on top"
					loading={adding}
					color='black'
					onClick={() => onBoxAdd(boxTypes.DEEP)}
				>
					<AddBoxIcon /><span><T ctx="this is a button to add new section of beehive, a deep box that is intended for brood frames">Add deep</T></span>
				</Button>
				<PopupButtonGroup>
					<Button
						loading={adding}
						title="Add super on top"
						onClick={() => onBoxAdd(boxTypes.SUPER)}
					>
						<AddSuperIcon /><span><T ctx="this is a button to add new section of beehive, a super box that is intended for honey frames">Add super</T></span>
					</Button>

					<PopupButton>
						<Button
							loading={adding}
							title="Add gate"
							onClick={() => onBoxAdd(boxTypes.GATE)}
						>
							<GateIcon /><span><T ctx="this is a button to add new section of beehive, specifically holes, an entrance">Add base</T></span>
						</Button>
						<Button
							loading={adding}
							title="Add ventilation"
							onClick={() => onBoxAdd(boxTypes.VENTILATION)}
						><span><T ctx="this is a button to add tiny part of beehive, specifically holes on top for ventilation">Add inner lid</T></span>
						</Button>
						<Button
							loading={adding}
							title="Add queen excluder"
							onClick={() => onBoxAdd(boxTypes.QUEEN_EXCLUDER)}
						><span><T ctx="this is a button to add tiny part of beehive, a horizontal layer that prevents queen bee from moving through this">Add queen excluder</T></span>
						</Button>
						<Button
							loading={adding}
							title="Add feeder"
							onClick={() => onBoxAdd(boxTypes.HORIZONTAL_FEEDER)}
						><span><T ctx="this is a button to add tiny part of beehive, a horizontal box where sugar syrup can be poured to feed bees">Add feeder</T></span>
						</Button>


						<Button
                            color="red"
                            loading={removingBox}
                            onClick={() => {
                                onBoxRemove(+box.id)
                            }}
                        ><DeleteIcon /> <T>Remove box</T></Button>
					</PopupButton>
				</PopupButtonGroup>
			</div>
		</>
	)
}