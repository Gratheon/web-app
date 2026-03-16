export function addCustomIndexes(dbSchema) {
	dbSchema.family += ',hiveId'
	dbSchema.box += ',hiveId,[hiveId+position]'
	dbSchema.file += ',hiveId'
	dbSchema.frame += ',boxId,hiveId,leftId,rightId'
	dbSchema.frameside += ',frameId'
	dbSchema.frame_side_inspection += ',[frameSideId+inspectionId]'
	dbSchema.files_frame_side_cells += ',frameSideId'
	dbSchema.frame_side_file += ',id'

	// New translation tables - ALWAYS create these, even if not in GraphQL schema
	// Use ++id for auto-incrementing primary key (not &id!)
	dbSchema.translation = '++id, key, namespace, [key+namespace]'
	dbSchema.translationvalue = '++id, [translationId+lang], translationId, lang'
	dbSchema.pluralform = '++id, [translationId+lang], translationId, lang'
	dbSchema.hive_log = '++id,hiveId,createdAt,updatedAt,action,source,dedupeKey'

	// Remove old locale table (set to null to delete in version 103)
	if (dbSchema.locale) {
		dbSchema.locale = null;
	}
}
