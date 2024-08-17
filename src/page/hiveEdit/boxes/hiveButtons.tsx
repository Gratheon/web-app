import { useNavigate } from 'react-router'

import { useMutation } from '../../../api'
import Button from '../../../shared/button'
import {
	boxTypes,
	addBox,
	maxBoxPosition
} from '../../../models/boxes.ts'
import T from '../../../shared/translate'

import AddBoxIcon from '../../../icons/addBox.tsx'
import AddSuperIcon from '../../../icons/addSuper.tsx'
import GateIcon from '../../../icons/gate.tsx'
import ErrorMessage from '../../../shared/messageError'

import { useState } from 'react'
import metrics from '../../../metrics.tsx'
import styles from './styles.module.less'
import { PopupButton, PopupButtonGroup } from '../../../shared/popupButton'

export default function HiveButtons({
	apiaryId,
	hiveId
}) {
	let navigate = useNavigate()
	const [adding, setAdding] = useState(false)

	let [addBoxMutation, { error }] =
		useMutation(`mutation addBox($hiveId: ID!, $position: Int!, $type: BoxType!) {
	addBox(hiveId: $hiveId, position: $position, type: $type) {
		id
		position
	}
}
`)

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

	return (
		<>
			<ErrorMessage error={error} />
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
					</PopupButton>
				</PopupButtonGroup>
			</div>
		</>
	)
}