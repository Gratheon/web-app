import { useNavigate } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'

import { getBoxes } from '@/components/models/boxes'
import { useQuery } from '@/components/api'
import Loader from '@/components/shared/loader'
import HiveBoxes from '@/components/shared/hiveBoxes'

import BOXES_QUERY from './boxesQuery.graphql'


type BoxesProps = {
	hiveId: any
	apiaryId: any
	boxId: any
	frameId: any
	frameSideId: any

	editable?: boolean

	onBoxClick?: any
	onBoxRemove?: any
	onBoxAdd?: any
	onMoveDown?: any

	onFrameClose?: any
	onFrameAdd?: any
	onFrameSideFileUpload?: any
	onDragDropFrame?: any
	onFrameSideStatChange?: any

	onError: any
	displayMode: string
}

export default function Boxes({
	hiveId,
	apiaryId,
	boxId,
	frameId,
	frameSideId,
	onError,
	editable = true,
	displayMode = 'visual',
}: BoxesProps) {
	let navigate = useNavigate()

	const boxes = useLiveQuery(() => getBoxes({ hiveId: +hiveId }), [hiveId], false)

	if (boxes === false) {
		return <Loader />
	}

	if (boxes?.length == 0) {
		let { loading } = useQuery(BOXES_QUERY, { variables: { id: +hiveId, apiaryId: +apiaryId } })

		if (loading) {
			return <Loader />
		}
	}

	function onBoxClick({ event, boxId }) {
		// match only background div to consider it as a selection to avoid overriding redirect to frame click
		if (
			typeof event.target.className === 'string' &&
			event.target.className.length > 0
		) {
			event.stopPropagation()
			navigate(`/apiaries/${apiaryId}/hives/${hiveId}/box/${boxId}`, {
				replace: true,
			})
		}
	}

	return (
		<HiveBoxes
			boxes={boxes}

			apiaryId={apiaryId}
			hiveId={hiveId}
			boxId={boxId}
			frameId={frameId}
			frameSideId={frameSideId}

			onBoxClick={onBoxClick}
			onError={onError}
			editable={editable}
			displayMode={displayMode}
			/>
	)
}
