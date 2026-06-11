export type ImageResizeCandidate = {
	width?: number | string | null;
	max_dimension_px?: number | string | null;
	url?: string | null;
};

export function getImageResizeDimension(resize: ImageResizeCandidate | undefined | null): number {
	return Number(resize?.max_dimension_px ?? resize?.width ?? 0);
}

type SelectImageUrlParams = {
	originalUrl?: string | null;
	resizes?: Array<ImageResizeCandidate | null | undefined> | null;
	requiredDimensionPx?: number;
	allowOriginal?: boolean;
	allowOriginalWhenNoResizes?: boolean;
	minimumResizeDimensionPx?: number;
};

export function selectImageUrlForRequiredSize({
	originalUrl,
	resizes = [],
	requiredDimensionPx = 0,
	allowOriginal = true,
	allowOriginalWhenNoResizes = allowOriginal,
	minimumResizeDimensionPx = 0,
}: SelectImageUrlParams): string | undefined {
	const requiredDimension = Number.isFinite(requiredDimensionPx)
		? Math.max(0, requiredDimensionPx)
		: 0;
	const validResizes = (resizes || [])
		.filter((resize): resize is ImageResizeCandidate => {
			const dimension = getImageResizeDimension(resize);
			return Boolean(resize?.url) && dimension > minimumResizeDimensionPx;
		})
		.sort((a, b) => getImageResizeDimension(a) - getImageResizeDimension(b));

	if (validResizes.length === 0) {
		return allowOriginalWhenNoResizes && originalUrl ? originalUrl : undefined;
	}

	const matchingResize = validResizes.find(
		(resize) => getImageResizeDimension(resize) >= requiredDimension
	);
	if (matchingResize?.url) {
		return matchingResize.url;
	}

	const largestResize = validResizes[validResizes.length - 1];
	if (allowOriginal && originalUrl) {
		return originalUrl;
	}

	return largestResize?.url || undefined;
}
