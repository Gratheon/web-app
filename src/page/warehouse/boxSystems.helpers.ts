export type BoxSystemListItem = {
	id: string
	isDefault?: boolean
}

export type ApiaryHive = {
	boxSystemId?: string | null
}

export type ApiaryWithHives = {
	hives?: ApiaryHive[] | null
}

export function buildActiveHiveCountBySystemId(apiaries: ApiaryWithHives[] = []): Record<string, number> {
	const counts: Record<string, number> = {}
	for (const apiary of apiaries) {
		for (const hive of apiary?.hives || []) {
			const systemId = hive?.boxSystemId ? String(hive.boxSystemId) : ''
			if (!systemId) continue
			counts[systemId] = (counts[systemId] || 0) + 1
		}
	}
	return counts
}

export function pickDefaultReplacementSystem(
	systems: BoxSystemListItem[],
	archivingSystemId: string,
): BoxSystemListItem | null {
	return (
		systems.find((system) => system.id !== archivingSystemId && system.isDefault)
		|| systems.find((system) => system.id !== archivingSystemId)
		|| null
	)
}
