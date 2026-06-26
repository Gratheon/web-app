import type { ApiaryRouteContext, FrameRouteContext } from './types'

export function getHiveContext(pathname: string) {
	const matches = pathname.match(/^\/apiaries\/(\d+)\/hives\/(\d+)(?:\/|$)/)
	if (!matches) return null
	return {
		apiaryId: +matches[1],
		hiveId: +matches[2],
	}
}

export function getFrameRouteContext(
	pathname: string
): FrameRouteContext | null {
	const matches = pathname.match(
		/^\/apiaries\/\d+\/hives\/\d+\/box\/(\d+)\/frame\/(\d+)(?:\/(\d+))?(\/canvas-edit)?(?:\/|$)/
	)
	if (!matches) return null
	return {
		boxId: +matches[1],
		frameId: +matches[2],
		frameSideId: matches[3] ? +matches[3] : null,
		isCanvasEdit: Boolean(matches[4]),
	}
}

export function getApiaryOverviewContext(
	pathname: string
): ApiaryRouteContext | null {
	const matches = pathname.match(/^\/apiaries\/(\d+)\/?$/)
	if (!matches) return null
	return {
		apiaryId: +matches[1],
	}
}
