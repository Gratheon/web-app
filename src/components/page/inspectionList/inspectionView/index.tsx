import { useQuery } from '@/components/api'
import INSPECTION_QUERY from './singleInspectionQuery.graphql'
import Loading from '@/components/shared/loader'
import ErrorMsg from '@/components/shared/messageError'
import HiveBoxes from '@/components/shared/hiveBoxes'
import { InspectionSnapshot } from '@/components/models/inspections'
import { upsertFrameSide } from '@/components/models/frameSide'
import { upsertFrame } from '@/components/models/frames'

type InspectionViewProps = {
	apiaryId?: string
	hiveId?: string
	inspectionId?: string
}

export default function InspectionView({
	apiaryId,
	hiveId,
	inspectionId,
}: InspectionViewProps) {
	let {
		loading: loadingGet,
		error: errorGet,
		data: inspectionGet,
	} = useQuery(INSPECTION_QUERY, {
		variables: {
			inspectionId: inspectionId,
			hiveId: hiveId,
		},
	})

	if (loadingGet) {
		return <Loading />
	}

	if (errorGet) {
		return <ErrorMsg error={errorGet} />
	}

	//@ts-ignore
	let { inspection, hive, frameSidesInspections }: { inspection: any; hive: any, frameSidesInspections:any } = inspectionGet

	const inspectionData: InspectionSnapshot = JSON.parse(inspection.data)

	console.log({frameSidesInspections})

	// restore data back to indexdb for component to fetch IDs
	// to fetch frame stats from backend
	inspectionData.frames.forEach((frame) => {
		upsertFrame(frame)
		upsertFrameSide(frame.leftSide)
		upsertFrameSide(frame.rightSide)
	})

	return (
		<div>
			<HiveBoxes
				boxes={inspectionData.boxes}

				inspectionId={inspectionId}
				hiveId={hive.id}
				apiaryId={apiaryId}
				boxId={null}
				frameId={null}
				frameSideId={null}

				editable={false}
			/>
		</div>
	)
}
