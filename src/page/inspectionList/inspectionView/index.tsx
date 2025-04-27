import { useState } from 'react'; // Added useState
import { useQuery } from '../../../api'
import INSPECTION_QUERY from './singleInspectionQuery.graphql.ts'
import Loading from '../../../shared/loader'
import ErrorMsg from '../../../shared/messageError'
import DateTimeFormat from '../../../shared/dateTimeFormat/index.tsx'; // Import DateFormat
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
	// State for the selected full-size image URL
	const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

	// Handler to update the selected image URL
	const handleFrameImageClick = (imageUrl: string) => {
		setSelectedImageUrl(imageUrl);
	};

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
				// Pass down frame side data and click handler
				frameSidesData={typedFrameSidesInspections}
				onFrameImageClick={handleFrameImageClick}
			/>

			{/* Section to display the selected full-size image */}
			{selectedImageUrl && (
				<div style={{ marginTop: '20px', padding: '10px 30px', textAlign: 'center' }}>
					<button onClick={() => setSelectedImageUrl(null)} style={{ marginBottom: '10px' }}>
						Close Image
					</button>
					<div>
						<img
							src={selectedImageUrl}
							alt="Selected frame side"
							style={{ maxWidth: '100%', maxHeight: '80vh', border: '1px solid #ccc' }}
						/>
					</div>
				</div>
			)}
		</div>
	)
}
