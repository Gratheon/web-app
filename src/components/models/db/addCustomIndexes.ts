export function addCustomIndexes(dbSchema) {
	dbSchema.family += ',hiveId'
	dbSchema.box += ',hiveId,[hiveId+position]'
	dbSchema.file += ',hiveId'
	dbSchema.frame += ',boxId,hiveId,leftId,rightId'
	dbSchema.frameside += ',frameId'
	dbSchema.frame_side_inspection += ',[frameSideId+inspectionId]'
}
