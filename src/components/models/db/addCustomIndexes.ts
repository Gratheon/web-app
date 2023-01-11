export function addCustomIndexes(dbSchema) {
	dbSchema.family += ',hiveId'
	dbSchema.box += ',hiveId,[hiveId+position]'
	dbSchema.file += ',hiveId'
	dbSchema.frame += ',boxId,hiveId,leftId,rightId'
	dbSchema.frameside += ',frameId'
}
