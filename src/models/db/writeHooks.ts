import frameSideFileModel, { FrameSideFile } from '../frameSideFile.ts'
import { FrameSideCells } from '../frameSideCells.ts'

import { upsertEntity, upsertEntityWithNumericID } from './index.ts'

import { FrameSide } from '../frameSide.ts'
import { upsertFrameSide } from '../frameSide.ts'
import { Frame, upsertFrame } from '../frames.ts'
import { FileResize, upsertFileResize } from '../fileResize.ts'

export const writeHooks = {
	Apiary: async (_, entity) =>
		await upsertEntityWithNumericID('apiary', entity),
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
		if (parent) {
			value.boxId = +parent.id
		}

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

	FileResize: async ({ id }, entity: FileResize) => {
		entity.file_id = +id
		await upsertFileResize(entity)
	},

	FrameSideInspection: async (_, entity) => {
		entity.id = `${entity.inspectionId}_${entity.frameSideId}`
		entity.frameSideId = +entity.frameSideId
		entity.inspectionId = +entity.inspectionId
		await upsertEntity('frame_side_inspection', entity)
	},

	FrameSideFile: async (parent, entity: FrameSideFile, { originalValue }) => {
		await frameSideFileModel.upsertEntity(entity, originalValue)
	},
	FrameSideCells: async (_, cells: FrameSideCells, { originalValue }) => {
		if (Object.keys(cells).length === 0) return

		cells.broodPercent = cells?.broodPercent ? +cells.broodPercent : 0
		cells.cappedBroodPercent = cells?.cappedBroodPercent
			? +cells.cappedBroodPercent
			: 0
		cells.eggsPercent = cells?.eggsPercent ? +cells.eggsPercent : 0
		cells.pollenPercent = cells?.pollenPercent ? +cells.pollenPercent : 0
		cells.honeyPercent = cells?.honeyPercent ? +cells.honeyPercent : 0

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
