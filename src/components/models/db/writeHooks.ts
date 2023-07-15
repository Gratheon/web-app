import { FrameSide } from '@/components/api/schema'
import { upsertEntity } from './index'

export const writeHooks = {
	Apiary: async (_, apiary) => await upsertEntity('apiary', apiary),
	Hive: async (_, hive) => await upsertEntity('hive', hive),
	Box: async (parent, box) => {
		box.hiveId = +parent.id
		await upsertEntity('box', box)
	},
	Family: async ({ id }, family) => {
		family.hiveId = +id
		await upsertEntity('family', family)
	},
	Frame: async (parent, value, { originalValue: frame }) => {
		value.boxId = +parent.id

		if (frame.leftSide) {
			value.leftId = +frame.leftSide?.id
		}

		if (frame.rightSide) {
			value.rightId = +frame.rightSide?.id
		}

		await upsertEntity('frame', value)
	},
	FrameSide: async ({ id }, frameside:FrameSide) => {
		frameside.frameId = +id

		frameside.queenDetected= frameside?.queenDetected ? true : false;
		frameside.broodPercent = frameside?.broodPercent ? +frameside.broodPercent : 0;
		frameside.cappedBroodPercent= frameside?.cappedBroodPercent ? +frameside.cappedBroodPercent : 0;
		frameside.eggsPercent= frameside?.eggsPercent ? +frameside.eggsPercent : 0;
		frameside.pollenPercent= frameside?.pollenPercent ? +frameside.pollenPercent : 0;
		frameside.honeyPercent= frameside?.honeyPercent ? +frameside.honeyPercent : 0;
		frameside.workerCount= frameside?.workerCount ? +frameside.workerCount : 0;
		frameside.droneCount= frameside?.droneCount ? +frameside.droneCount : 0;

		await upsertEntity('frameside', frameside)
	},
	FrameSideFile: async (_, frameSideFile, { originalValue }) => {
		if (Object.keys(frameSideFile).length === 0) return

		delete frameSideFile.hiveId

		frameSideFile.fileId = +originalValue?.file?.id;
		frameSideFile.frameSideId = +frameSideFile.frameSideId
		frameSideFile.id = +frameSideFile.frameSideId

		if(frameSideFile.fileId){
			await upsertEntity('framesidefile', frameSideFile)
		}
	},
	File: async (_, file) => {
		// file.hiveId = +hiveId
		await upsertEntity('file', file)
	},
	User: async (_, user) => await upsertEntity('user', user),
}
