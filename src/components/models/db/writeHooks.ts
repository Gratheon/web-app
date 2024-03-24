import { FrameSide } from '@/components/api/schema'
import { FrameSideFile } from '@/components/models/frameSideFile'
import { FrameSideCells } from '@/components/models/frameSideCells'
import { Hive } from '@/components/models/hive'
import { upsertEntity } from './index'

export const writeHooks = {
	Apiary: async (_, entity) => await upsertEntity('apiary', entity),
	Hive: async (_, entity) => await upsertEntity('hive', entity),
	Box: async (parent, entity) => {
		entity.hiveId = +parent.id
		await upsertEntity('box', entity)
	},
	Family: async ({ id }, entity) => {
		entity.hiveId = +id
		await upsertEntity('family', entity)
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

		await upsertEntity('frameside', frameside)
	},
	FrameSideFile: async (_, fsf: FrameSideFile, { originalValue }) => {
		if (Object.keys(fsf).length === 0) return

		fsf.queenDetected= fsf?.queenDetected ? true : false;

		delete fsf.hiveId

		if(originalValue?.detectedCells){
			fsf.detectedCells = originalValue?.detectedCells;
		}
		
		fsf.fileId = +originalValue?.file?.id;
		fsf.frameSideId = +fsf.frameSideId
		fsf.id = +fsf.frameSideId

		if(fsf.fileId){
			await upsertEntity('framesidefile', fsf)
		}
	},
	FrameSideCells: async (_, cells: FrameSideCells, { originalValue }) => {
		if (Object.keys(cells).length === 0) return

		cells.broodPercent = cells?.broodPercent ? +cells.broodPercent : 0;
		cells.cappedBroodPercent= cells?.cappedBroodPercent ? +cells.cappedBroodPercent : 0;
		cells.eggsPercent= cells?.eggsPercent ? +cells.eggsPercent : 0;
		cells.pollenPercent= cells?.pollenPercent ? +cells.pollenPercent : 0;
		cells.honeyPercent= cells?.honeyPercent ? +cells.honeyPercent : 0;

		cells.frameSideId = +cells.id
		cells.id = +cells.id
		await upsertEntity('framesidecells', cells)
	},
	File: async (_, entity) => {
		await upsertEntity('file', entity)
	},
	Inspection: async (parent: Hive, entity) => {
		entity.hiveId = +parent.id
		await upsertEntity('inspection', entity)
	},
	User: async (_, entity) => await upsertEntity('user', entity),
	Locale: async (_, entity) => {
		await upsertEntity('locale', entity)
	},
}
