import { useQuery } from '@/components/api'
import INSPECTION_QUERY from './singleInspectionQuery.graphql'
import Loading from '@/components/shared/loader'
import ErrorMsg from '@/components/shared/messageError'
import HiveBoxes from '@/components/shared/hiveBoxes'

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
	let { inspection, hive }: { inspection: any; hive: any } = inspectionGet

	const inspectionData = JSON.parse(inspection.data)

	return (
		<div>
			<HiveBoxes
				boxes={inspectionData.boxes}

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
