import { useNavigate } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'

import { getBoxes } from '@/models/boxes.ts'
import { useQuery } from '@/api'
import Loader from '@/shared/loader'
import HiveBoxes from '@/shared/hiveBoxes'

import BOXES_QUERY from './boxesQuery.graphql.ts'

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
	setDisplayMode: any
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
	setDisplayMode,
}: BoxesProps) {
	let navigate = useNavigate()

	// Model function getBoxes now handles invalid IDs
	const boxes = useLiveQuery(
		() => getBoxes({ hiveId: +hiveId }),
		[hiveId],
		false
	)

	if (boxes === false) {
		return <Loader />
	}

	if (boxes?.length == 0) {
		let { loading } = useQuery(BOXES_QUERY, {
			variables: { id: +hiveId, apiaryId: +apiaryId },
		})

		if (loading) {
			return <Loader />
		}
	}

	function onBoxClick({ event, boxId }) {
		const target = event.target
		if (!(target instanceof Element)) return

		// Only react to clicks inside a hive section container.
		if (!target.closest('.boxOuterClick')) return

		// Frame click should keep frame navigation and must not be replaced by section navigation.
		if (target.closest('[data-frame-clickable="true"]')) return

		// Ignore explicit interactive controls.
		if (target.closest('button, a, input, select, textarea, [role="button"]'))
			return

		event.stopPropagation()
		navigate(`/apiaries/${apiaryId}/hives/${hiveId}/box/${boxId}`, {
			replace: true,
		})
	}

	return (
		<HiveBoxes
			boxes={boxes}
			apiaryId={apiaryId}
			hiveId={hiveId}
			boxId={boxId}
			frameId={frameId}
			frameSideId={frameSideId}
			setDisplayMode={setDisplayMode}
			onBoxClick={onBoxClick}
			onError={onError}
			editable={editable}
			displayMode={displayMode}
		/>
	)
}
