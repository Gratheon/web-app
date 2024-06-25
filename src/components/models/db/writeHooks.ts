import { FrameSideFile } from '@/components/models/frameSideFile'
import { FrameSideCells } from '@/components/models/frameSideCells'

import { upsertEntity, upsertEntityWithNumericID } from './index'

import { FrameSide } from '../frameSide'
import { upsertFrameSide } from '../frameSide'
import { Frame, upsertFrame } from '../frames'

export const writeHooks = {
	Apiary: async (_, entity) => await upsertEntityWithNumericID('apiary', entity),
	Hive: async (_, entity) => await upsertEntityWithNumericID('hive', entity),
	Box: async (parent, entity) => {
		entity.hiveId = +parent.id
		await upsertEntityWithNumericID('box', entity)
	},
	Family: async ({ id }, entity) => {
		entity.hiveId = +id
		await upsertEntityWithNumericID('family', entity)
	},
	Frame: async (parent, value: Frame, { originalValue: frame }) => {
		value.boxId = +parent.id

		if (frame.leftSide) {
			value.leftId = +frame.leftSide?.id
		}

		if (frame.rightSide) {
			value.rightId = +frame.rightSide?.id
		}
		
		await upsertFrame(value)
	},
	FrameSide: async ({ id }, frameside: FrameSide) => {
		frameside.frameId = +id

		await upsertFrameSide(frameside)
	},

	FrameSideInspection: async (_, entity) => {
		entity.id = `${entity.inspectionId}_${entity.frameSideId}`
		entity.frameSideId = +entity.frameSideId
		entity.inspectionId = +entity.inspectionId
		console.log('FrameSideInspection', entity)
		await upsertEntity('frame_side_inspection', entity)
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
			await upsertEntityWithNumericID('framesidefile', fsf)
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
		await upsertEntityWithNumericID('files_frame_side_cells', cells)
	},
	File: async (_, entity) => {
		await upsertEntityWithNumericID('file', entity)
	},
	Inspection: async (_, entity) => {
		entity.hiveId = +entity.hiveId
		await upsertEntityWithNumericID('inspection', entity)
	},
	User: async (_, entity) => await upsertEntityWithNumericID('user', entity),
	Locale: async (_, entity) => {
		await upsertEntityWithNumericID('locale', entity)
	},
}
