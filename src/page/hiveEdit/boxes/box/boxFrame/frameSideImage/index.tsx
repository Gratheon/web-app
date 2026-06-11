import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'

import { File, getFile } from '../../../../../../models/files.ts'
import { getFrameSideFile } from '../../../../../../models/frameSideFile.ts'
import { getFileResizes } from '../../../../../../models/fileResize.ts'
import { selectImageUrlForRequiredSize } from '@/shared/imageResizes'

import styles from './index.module.less'

// Define props type
type FrameSideImageProps = {
	editable: boolean
	selected?: boolean
	frameSideId: number
	frameURL: string
	dominantColor?: string | null
	placeholderColor?: string
	cellTexture?: 'foundation' | 'comb'
	// Add new optional props for inspection view
	frameSideData?: {
		file?: {
			id: number | string
			url: string // Original URL
			resizes?: Array<{
				id: number | string
				max_dimension_px: number
				url: string
			}>
		}
	}
	onImageClick?: (imageUrl: string) => void
}

export default function FrameSideImage({
	editable,
	selected = true,
	frameSideId,
	frameURL,
	dominantColor = null,
	placeholderColor = 'transparent',
	cellTexture = 'foundation',
	// Destructure new props
	frameSideData,
	onImageClick,
}: FrameSideImageProps) {
	const navigate = useNavigate()

	// --- Data Fetching Logic ---
	// Use Dexie only if frameSideData is not provided (i.e., in editable mode)
	const frameSideFile = useLiveQuery(() => {
		if (frameSideData) return null // Don't fetch if data is passed via prop
		return getFrameSideFile({ frameSideId })
	}, [frameSideId, !!frameSideData]) // Re-run if frameSideData presence changes

	const fileFromDexie: File | null =
		useLiveQuery(async (): Promise<File | null> => {
			if (frameSideData || !frameSideFile) return null
			return await getFile(frameSideFile?.fileId)
		}, [frameSideFile, !!frameSideData]) // Re-run if frameSideData presence changes

	const resizesFromDexie = useLiveQuery(
		() => {
			if (frameSideData || !frameSideFile) return null
			return getFileResizes({ file_id: +frameSideFile?.fileId })
		},
		[frameSideFile?.fileId, !!frameSideData],
		null
	) // Re-run if frameSideData presence changes
	// --- Determine Image URLs ---
	let displayUrl: string | undefined = undefined
	let originalUrl: string | undefined = undefined

	if (frameSideData?.file) {
		// Use data passed via props (inspection view)
		originalUrl = frameSideData.file.url
		displayUrl = selectImageUrlForRequiredSize({
			originalUrl,
			resizes: frameSideData.file.resizes || [],
			requiredDimensionPx: 128,
			allowOriginal: false,
			allowOriginalWhenNoResizes: false,
		})
	} else if (fileFromDexie) {
		// Use data fetched from Dexie (editable view)
		originalUrl = fileFromDexie.url
		displayUrl = selectImageUrlForRequiredSize({
			originalUrl,
			resizes: resizesFromDexie || [],
			requiredDimensionPx: 128,
			allowOriginal: false,
			allowOriginalWhenNoResizes: false,
		})
	}

	// --- Click Handler ---
	const handleClick = () => {
		if (!editable && onImageClick && originalUrl) {
			// Inspection view: call the callback with the original URL
			onImageClick(originalUrl)
		} else if (editable) {
			// Editable view: navigate
			navigate(frameURL, { replace: true })
		}
	}

	return (
		<div
			className={
				selected
					? `${styles.frameSideImage} ${styles.selected}`
					: styles.frameSideImage
			}
			onClick={handleClick} // Use the combined handler
		>
			{/* Apply dominantColor to the top div's background if no image */}
			{!displayUrl && (
				<div
					className={styles.frameSideImageInternalTop}
					style={{ backgroundColor: dominantColor ?? placeholderColor }}
				></div>
			)}
			{!displayUrl && (
				<div
					className={`${styles.frameSideImageInternalSides} ${
						cellTexture === 'comb' ? styles.combCells : styles.foundationCells
					}`}
					style={
						{
							'--frame-side-fill-color':
								dominantColor ?? placeholderColor,
						} as any
					}
				></div>
			)}

			{/* Render image if a small resize exists. Do not fall back to original here: these thumbnails are tiny. */}
			{displayUrl && (
				<img
					src={displayUrl}
					alt={`Frame side ${frameSideId}`}
					draggable={false}
					onDragStart={(e) => e.preventDefault()}
				/>
			)}
		</div>
	)
}
