export type FrameConfigurableBoxType = 'DEEP' | 'SUPER' | 'LARGE_HORIZONTAL_SECTION'

export type BoxSystemFrameSetting = {
	systemId: string
	boxType: FrameConfigurableBoxType
	frameSourceSystemId?: string | null
}

export type FrameSettingLookup = Record<string, BoxSystemFrameSetting>

export const FRAME_BOX_TYPE_ORDER: FrameConfigurableBoxType[] = ['DEEP', 'SUPER', 'LARGE_HORIZONTAL_SECTION']

export function frameSettingLookupKey(systemId: string, boxType: FrameConfigurableBoxType): string {
	return `${systemId}:${boxType}`
}

export function buildFrameSettingLookup(
	frameSettings: BoxSystemFrameSetting[] = [],
): FrameSettingLookup {
	return frameSettings.reduce((acc: FrameSettingLookup, setting: BoxSystemFrameSetting) => {
		acc[frameSettingLookupKey(setting.systemId, setting.boxType)] = setting
		return acc
	}, {})
}

export function getCurrentFrameProfileSource(
	targetSystemId: string,
	frameSettingBySystemAndType: FrameSettingLookup,
): string {
	const sources = FRAME_BOX_TYPE_ORDER
		.map((boxType) => frameSettingBySystemAndType[frameSettingLookupKey(targetSystemId, boxType)])
		.filter(Boolean)
		.map((setting) => String(setting!.frameSourceSystemId || targetSystemId))

	if (!sources.length) return targetSystemId
	const unique = Array.from(new Set(sources))
	if (unique.length === 1) return unique[0]
	return '__MIXED__'
}

export function hasExplicitOwnFrameMapping(
	targetSystemId: string,
	frameSettingBySystemAndType: FrameSettingLookup,
): boolean {
	return FRAME_BOX_TYPE_ORDER.every((boxType) => {
		const setting = frameSettingBySystemAndType[frameSettingLookupKey(targetSystemId, boxType)]
		return String(setting?.frameSourceSystemId || '') === targetSystemId
	})
}

export async function applyFrameSourceToAllBoxTypes(
	setFrameSource: (params: {
		systemId: string
		boxType: FrameConfigurableBoxType
		frameSourceSystemId: string
	}) => Promise<unknown>,
	systemId: string,
	frameSourceSystemId: string,
): Promise<void> {
	for (const boxType of FRAME_BOX_TYPE_ORDER) {
		await setFrameSource({
			systemId,
			boxType,
			frameSourceSystemId,
		})
	}
}
