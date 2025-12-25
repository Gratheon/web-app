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

	console.log('[addCustomIndexes] Translation tables schema:');
	console.log('[addCustomIndexes] translation:', dbSchema.translation);
	console.log('[addCustomIndexes] translationvalue:', dbSchema.translationvalue);
	console.log('[addCustomIndexes] pluralform:', dbSchema.pluralform);

	// Remove old locale table (set to null to delete in version 103)
	if (dbSchema.locale) {
		console.log('[addCustomIndexes] Removing old locale table');
		dbSchema.locale = null;
	}

	console.log('[addCustomIndexes] Final schema keys:', Object.keys(dbSchema).join(', '));
}
