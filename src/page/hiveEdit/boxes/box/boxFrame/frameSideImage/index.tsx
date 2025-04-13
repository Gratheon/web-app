import {useNavigate} from 'react-router-dom'
import {useLiveQuery} from 'dexie-react-hooks';

import {File, getFile} from '../../../../../../models/files.ts'
import {getFrameSideFile} from '../../../../../../models/frameSideFile.ts';
import {getFileResizes} from '../../../../../../models/fileResize.ts';

import styles from './index.module.less';

// Define props type
type FrameSideImageProps = {
	editable: boolean;
	selected?: boolean;
	frameSideId: number;
	frameURL: string;
	dominantColor?: string | null;
	// Add new optional props for inspection view
	frameSideData?: {
		file?: {
			id: number | string;
			url: string; // Original URL
			resizes?: Array<{ id: number | string; max_dimension_px: number; url: string }>;
		}
	};
	onImageClick?: (imageUrl: string) => void;
}

export default function FrameSideImage({
	editable,
	selected = true,
	frameSideId,
	frameURL,
	dominantColor = null,
	// Destructure new props
	frameSideData,
	onImageClick,
}: FrameSideImageProps) {
	const navigate = useNavigate();

	// --- Data Fetching Logic ---
	// Use Dexie only if frameSideData is not provided (i.e., in editable mode)
	const frameSideFile = useLiveQuery(() => {
		if (frameSideData) return null; // Don't fetch if data is passed via prop
		return getFrameSideFile({ frameSideId });
	}, [frameSideId, !!frameSideData]); // Re-run if frameSideData presence changes

	const fileFromDexie: File | null = useLiveQuery(async (): Promise<File | null> => {
		if (frameSideData || !frameSideFile) return null;
		return await getFile(frameSideFile?.fileId);
	}, [frameSideFile, !!frameSideData]); // Re-run if frameSideData presence changes

	const resizesFromDexie = useLiveQuery(() => {
		if (frameSideData || !frameSideFile) return null;
		return getFileResizes({ file_id: +frameSideFile?.fileId });
	}, [frameSideFile?.fileId, !!frameSideData], null); // Re-run if frameSideData presence changes

	// --- Determine Image URLs ---
	let displayUrl: string | undefined = undefined;
	let originalUrl: string | undefined = undefined;

	if (frameSideData?.file) {
		// Use data passed via props (inspection view)
		originalUrl = frameSideData.file.url;
		const thumb = frameSideData.file.resizes?.find(r => r.max_dimension_px === 512);
		displayUrl = thumb?.url || originalUrl;
	} else if (fileFromDexie) {
		// Use data fetched from Dexie (editable view)
		originalUrl = fileFromDexie.url;
		let selectedSize = 2000;
		displayUrl = originalUrl; // Default to original
		if (resizesFromDexie != null && resizesFromDexie.length > 0) {
			for (let i = 0; i < resizesFromDexie.length; i++) {
				// Prefer smaller resize for display
				if (resizesFromDexie[i].max_dimension_px < selectedSize) {
					selectedSize = resizesFromDexie[i].max_dimension_px;
					displayUrl = resizesFromDexie[i].url;
				}
			}
		}
	}

	// --- Click Handler ---
	const handleClick = () => {
		if (!editable && onImageClick && originalUrl) {
			// Inspection view: call the callback with the original URL
			onImageClick(originalUrl);
		} else if (editable) {
			// Editable view: navigate
			navigate(frameURL, { replace: true });
		}
	};

	return (
		<div
			className={selected ? `${styles.frameSideImage} ${styles.selected}` : styles.frameSideImage}
			onClick={handleClick} // Use the combined handler
		>
			{/* Apply dominantColor to the top div's background if no image */}
			{!displayUrl && <div
				className={styles.frameSideImageInternalTop}
				style={{ backgroundColor: dominantColor ?? 'transparent' }}
			></div>}
			{!displayUrl && <div className={styles.frameSideImageInternalSides}></div>}

			{/* Render image if URL exists */}
			{displayUrl && <img src={displayUrl} alt={`Frame side ${frameSideId}`} />}
		</div>
	)
}
