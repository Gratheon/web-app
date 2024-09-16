import { useQuery } from '../../../api'
import INSPECTION_QUERY from './singleInspectionQuery.graphql.ts'
import Loading from '../../../shared/loader'
import ErrorMsg from '../../../shared/messageError'
import HiveBoxes from '../../../shared/hiveBoxes'
import { Inspection, InspectionSnapshot } from '../../../models/inspections.ts'
import { upsertFrameSide } from '../../../models/frameSide.ts'
import { upsertFrame } from '../../../models/frames.ts'
import { Hive } from '../../../models/hive.ts'

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
		errorNetwork,
	} = useQuery(INSPECTION_QUERY, {
		variables: {
			inspectionId: inspectionId,
			hiveId: hiveId,
		},
	})

	if (loadingGet) {
		return <Loading />
	}

	if (errorGet || errorNetwork) {
		return <ErrorMsg error={errorGet || errorNetwork} />
	}

	//@ts-ignore
	let {
		inspection,
		hive,
		frameSidesInspections,
	}: {
		inspection: Inspection
		hive: Hive
		frameSidesInspections: any
	} = inspectionGet

	let inspectionData: InspectionSnapshot
	if (inspection) {
		inspectionData = JSON.parse(inspection.data)

		// restore data back to indexdb for component to fetch IDs
		// to fetch frame stats from backend
		inspectionData.frames.forEach(async (frame) => {
			if (frame) await upsertFrame(frame)
			if (frame.leftSide) await upsertFrameSide(frame.leftSide)
			if (frame.rightSide) await upsertFrameSide(frame.rightSide)
		})
	}

	return (
		<div>
			<HiveBoxes
				boxes={inspectionData?.boxes}
				inspectionId={inspectionId}
				hiveId={hive?.id}
				apiaryId={apiaryId}
				boxId={null}
				frameId={null}
				frameSideId={null}
				editable={false}
				displayMode={'visual'}
			/>

			{/*<div style="padding: 10px 30px;">*/}
			{/*	{frameSidesInspections && frameSidesInspections.length > 0 && <h3>Frame images</h3>}*/}

			{/*	{frameSidesInspections.map((frameSideInspection) => {*/}
			{/*		for (let thumb of frameSideInspection.file.resizes) {*/}
			{/*			if (thumb.max_dimension_px === 512) {*/}
			{/*				<img key={frameSideInspection.frameSideId}*/}
			{/*					width="256"*/}
			{/*					src={thumb.url} alt="frame" />*/}
			{/*			}*/}
			{/*		}*/}

			{/*		return (*/}
			{/*			<img key={frameSideInspection.frameSideId}*/}
			{/*				width="256"*/}
			{/*				src={frameSideInspection.file.url} alt="frame" />*/}
			{/*		)*/}
			{/*	})}*/}
			{/*</div>*/}
		</div>
	)
}
