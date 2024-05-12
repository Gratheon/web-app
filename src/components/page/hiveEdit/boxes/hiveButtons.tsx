import { useNavigate } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'

// import { isFrameWithSides } from '@/components/models/frames'
import { useMutation } from '@/components/api'
import Button from '@/components/shared/button'
import {
	boxTypes,
	getBoxes,
	addBox,
	maxBoxPosition
} from '@/components/models/boxes'
import T from '@/components/shared/translate'
import { useQuery } from '@/components/api'

import AddBoxIcon from '@/components/icons/addBox'
import AddSuperIcon from '@/components/icons/addSuper'
import GateIcon from '@/components/icons/gate'
import ErrorMessage from '@/components/shared/messageError'
import Loader from '@/components/shared/loader'

import Gate from './gate'
import Box from './box'
import FrameButtons from './box/frameButtons'
import styles from './styles.less'

import BOXES_QUERY from './boxesQuery.graphql'
import { useState } from 'react'
import metrics from '@/components/metrics'
import Ventilation from './ventilation'
import QueenExcluder from './queenExcluder'
import FeederHorizontal from './feederHorizontal'

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
			<div style="display: grid; gap: 1px; grid-template-columns: repeat(3, 1fr);">
				<Button
					title="Add box on top"
					loading={adding}
					color='black'
					onClick={() => onBoxAdd(boxTypes.DEEP)}
				>
					<AddBoxIcon /><span><T ctx="this is a button to add new section of beehive, a deep box that is intended for brood frames">Add deep</T></span>
				</Button>
				<Button
					loading={adding}
					title="Add super on top"
					onClick={() => onBoxAdd(boxTypes.SUPER)}
				>
					<AddSuperIcon /><span><T ctx="this is a button to add new section of beehive, a super box that is intended for honey frames">Add super</T></span>
				</Button>
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
			</div>
		</>
	)
}