import { useQuery } from '../../../api'
import INSPECTION_QUERY from './singleInspectionQuery.graphql.ts'
import Loading from '../../../shared/loader'
import ErrorMsg from '../../../shared/messageError'
import HiveBoxes from '../../../shared/hiveBoxes'
import { Inspection, InspectionSnapshot } from '../../../models/inspections.ts'
import { Hive } from '../../../models/hive.ts'
// Removed unused upsertFrameSide and upsertFrame imports

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
		// Keep parsing for HiveBoxes component, but remove redundant upserts
		inspectionData = JSON.parse(inspection.data)
	}

	// Type assertion for frameSidesInspections if needed, assuming it matches the expected structure
	const typedFrameSidesInspections = frameSidesInspections as Array<{
		frameSideId: number | string
		inspectionId: number | string
		file?: {
			id: number | string
			url: string
			resizes: Array<{ id: number | string; max_dimension_px: number; url: string }>
		}
		cells?: any // Add specific type if available
	}> || []


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

			{/* Uncomment and adapt the image rendering section */}
			<div style={{ padding: '10px 30px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
				{typedFrameSidesInspections && typedFrameSidesInspections.length > 0 && <h3>Frame images</h3>}

				{typedFrameSidesInspections.map((frameSideInspection) => {
					// Find the 512px thumbnail, or fallback to the main URL
					const thumb = frameSideInspection.file?.resizes?.find(
						(r) => r.max_dimension_px === 512
					);
					const imageUrl = thumb?.url || frameSideInspection.file?.url;

					// Render image only if URL exists
					if (imageUrl) {
						return (
							<img
								key={frameSideInspection.frameSideId}
								width="256" // Consider making this responsive or configurable
								src={imageUrl}
								alt={`Frame side ${frameSideInspection.frameSideId}`}
								style={{ border: '1px solid #ccc' }} // Add some basic styling
							/>
						);
					}
					return null; // Return null if no image URL is available
				})}
			</div>
		</div>
	)
}
